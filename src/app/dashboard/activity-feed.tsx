"use client";

import { useCallback, useState } from "react";

import { CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow, differenceInMinutes } from "date-fns";
import { CheckCircle2, Plus, ShoppingBag, UserPlus, Repeat, Undo2, RotateCcw, Loader2, SmilePlus } from "lucide-react";
import { InfiniteList } from "@/components/ui/infinite-list";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

interface ActivityLog {
    id: string;
    action: string;
    createdAt: string;
    choreId?: string | null;
    proofImage?: string | null;
    user: {
        name: string | null;
    };
    chore: {
        id: string;
        title: string;
        points?: number;
    } | null;
    metadata?: {
        choreTitle?: string;
        chorePoints?: number;
    } | null;
    reactions?: {
        emoji: string;
        userId: string;
    }[];
}

const REACTION_EMOJIS = ["👏", "🎉", "❤️", "🔥", "😂"];

export function ActivityFeed({ householdId }: { householdId: string }) {
    const router = useRouter();
    const [undoingId, setUndoingId] = useState<string | null>(null);
    const [reactingId, setReactingId] = useState<string | null>(null);
    const [localReactions, setLocalReactions] = useState<Record<string, { emoji: string; userId: string }[]>>({});

    const getIcon = (action: string) => {
        switch (action) {
            case "CREATED":
                return <Plus className="w-4 h-4 text-blue-500" />;
            case "COMPLETED":
                return <CheckCircle2 className="w-4 h-4 text-green-500" />;
            case "CLAIMED":
                return <UserPlus className="w-4 h-4 text-purple-500" />;
            case "REDEEMED":
                return <ShoppingBag className="w-4 h-4 text-yellow-500" />;
            case "RECURRED":
                return <Repeat className="w-4 h-4 text-blue-400" />;
            case "RESTORED":
                return <RotateCcw className="w-4 h-4 text-orange-500" />;
            default:
                return <Plus className="w-4 h-4 text-gray-500" />;
        }
    };

    const getMessage = (log: ActivityLog) => {
        const userName = log.user?.name || "Someone";
        const choreTitle = log.metadata?.choreTitle || log.chore?.title || "a chore";
        const chorePoints = log.metadata?.chorePoints || log.chore?.points;

        switch (log.action) {
            case "CREATED":
                return (
                    <span>
                        <span className="font-medium">{userName}</span> added{" "}
                        <span className="font-medium">{choreTitle}</span>
                        {chorePoints && <span className="text-muted-foreground ml-1">({chorePoints} XP)</span>}
                    </span>
                );
            case "COMPLETED":
                return (
                    <span>
                        <span className="font-medium">{userName}</span> completed{" "}
                        <span className="font-medium">{choreTitle}</span>
                        {chorePoints && <span className="text-green-600 font-medium ml-1">(+{chorePoints} XP)</span>}
                    </span>
                );
            case "CLAIMED":
                return (
                    <span>
                        <span className="font-medium">{userName}</span> claimed{" "}
                        <span className="font-medium">{choreTitle}</span>
                    </span>
                );
            case "UPDATED":
                return (
                    <span>
                        <span className="font-medium">{userName}</span> updated{" "}
                        <span className="font-medium">{choreTitle}</span>
                    </span>
                );
            case "REDEEMED":
                return (
                    <span>
                        <span className="font-medium">{userName}</span> redeemed a reward
                    </span>
                );
            case "RECURRED":
                return (
                    <span>
                        <span className="font-medium">{choreTitle}</span> was auto-renewed
                    </span>
                );
            case "RESTORED":
                return (
                    <span>
                        <span className="font-medium">{userName}</span> restored{" "}
                        <span className="font-medium">{choreTitle}</span>
                    </span>
                );
            default:
                return <span>{userName} did something</span>;
        }
    };

    const handleUndo = async (choreId: string, activityLogId: string) => {
        setUndoingId(activityLogId);
        try {
            const res = await fetch(`/api/chores/${choreId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "UNDO", activityLogId }),
            });
            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || "Failed to undo");
            }
            toast.success("Chore restored!");
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || "Failed to undo");
        } finally {
            setUndoingId(null);
        }
    };

    const handleReaction = async (activityLogId: string, emoji: string) => {
        setReactingId(activityLogId);
        try {
            const res = await fetch("/api/reactions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ activityLogId, emoji }),
            });
            if (!res.ok) throw new Error("Failed to react");

            // Optimistically update local state
            const data = await res.json();
            setLocalReactions(prev => {
                const current = prev[activityLogId] || [];
                if (data.action === "removed") {
                    return { ...prev, [activityLogId]: current.filter(r => r.emoji !== emoji) };
                } else if (data.action === "updated") {
                    return { ...prev, [activityLogId]: current.map(r => ({ ...r, emoji })) };
                } else {
                    return { ...prev, [activityLogId]: [...current, { emoji, userId: "me" }] };
                }
            });
        } catch {
            toast.error("Failed to add reaction");
        } finally {
            setReactingId(null);
        }
    };

    const getReactionCounts = (reactions: { emoji: string }[]) => {
        const counts: Record<string, number> = {};
        reactions.forEach(r => {
            counts[r.emoji] = (counts[r.emoji] || 0) + 1;
        });
        return counts;
    };

    const renderItem = (item: any, index: number) => {
        const log = item as ActivityLog;
        const allReactions = [...(log.reactions || []), ...(localReactions[log.id] || [])];
        const reactionCounts = getReactionCounts(allReactions);

        let canUndo = false;
        if (log.action === "COMPLETED" && log.chore?.id) {
            let dateStr = log.createdAt;
            if (!dateStr.endsWith("Z") && !dateStr.includes("+")) {
                dateStr += "Z";
            }
            const completedAt = new Date(dateStr);
            const minutesAgo = differenceInMinutes(new Date(), completedAt);
            canUndo = minutesAgo < 60;
        }

        return (
            <div key={log.id} className="flex items-start gap-3 text-sm border-b pb-3 last:border-0">
                <div className="mt-0.5">{getIcon(log.action)}</div>
                <div className="flex-1 space-y-1">
                    <p className="leading-none">{getMessage(log)}</p>
                    <p className="text-xs text-muted-foreground">
                        {(() => {
                            let dateStr = log.createdAt;
                            if (!dateStr.endsWith("Z") && !dateStr.includes("+")) {
                                dateStr += "Z";
                            }
                            return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
                        })()}
                    </p>
                    {log.proofImage && (
                        <div className="mt-2">
                            <a href={log.proofImage} target="_blank" rel="noopener noreferrer">
                                <img
                                    src={log.proofImage}
                                    alt="Proof"
                                    className="w-24 h-24 object-cover rounded-md border hover:opacity-90 transition-opacity"
                                />
                            </a>
                        </div>
                    )}
                    {/* Reactions display */}
                    <div className="flex items-center gap-1 mt-1 flex-wrap">
                        {Object.entries(reactionCounts).map(([emoji, count]) => (
                            <button
                                key={emoji}
                                onClick={() => handleReaction(log.id, emoji)}
                                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs rounded-full bg-muted hover:bg-muted/80 transition-colors"
                            >
                                <span>{emoji}</span>
                                <span className="text-muted-foreground">{count}</span>
                            </button>
                        ))}
                        <Popover>
                            <PopoverTrigger asChild>
                                <button
                                    className="inline-flex items-center justify-center w-6 h-6 rounded-full hover:bg-muted transition-colors"
                                    disabled={reactingId === log.id}
                                >
                                    {reactingId === log.id ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                        <SmilePlus className="w-3.5 h-3.5 text-muted-foreground" />
                                    )}
                                </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-1" align="start">
                                <div className="flex gap-0.5">
                                    {REACTION_EMOJIS.map(emoji => (
                                        <button
                                            key={emoji}
                                            onClick={() => handleReaction(log.id, emoji)}
                                            className="p-1.5 text-lg hover:bg-muted rounded transition-colors"
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
                {canUndo && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                        onClick={() => handleUndo(log.chore!.id, log.id)}
                        disabled={undoingId === log.id}
                        title="Undo this completion"
                    >
                        {undoingId === log.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                            <>
                                <Undo2 className="w-3 h-3 mr-1" />
                                Undo
                            </>
                        )}
                    </Button>
                )}
            </div>
        );
    };

    const trailingQuery = useCallback((query: any) => {
        return query.eq('householdId', householdId).order('createdAt', { ascending: false });
    }, [householdId]);

    return (
        <CardContent className="h-[400px] p-0">
            <InfiniteList
                tableName="ActivityLog"
                columns="*, user:User(name), chore:Chore(id, title), reactions:ActivityReaction(emoji, userId)"
                pageSize={10}
                className="p-6"
                trailingQuery={trailingQuery}
                renderItem={renderItem}
                renderNoResults={() => <p className="text-sm text-muted-foreground text-center">No recent activity.</p>}
                realtime={true}
                realtimeFilter={{ column: 'householdId', value: householdId }}
            />
        </CardContent>
    );
}
