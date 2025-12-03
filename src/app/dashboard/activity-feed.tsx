"use client";

import { useCallback } from "react";


import { CardContent } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { CheckCircle2, Plus, ShoppingBag, UserPlus } from "lucide-react";
import { InfiniteList } from "@/components/ui/infinite-list";

interface ActivityLog {
    id: string;
    action: string;
    createdAt: string; // Supabase returns string
    proofImage?: string | null;
    user: {
        name: string | null;
    };
    chore: {
        title: string;
    } | null;
    metadata?: any;
}

export function ActivityFeed({ householdId }: { householdId: string }) {
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
            default:
                return <Plus className="w-4 h-4 text-gray-500" />;
        }
    };

    const getMessage = (log: ActivityLog) => {
        const userName = log.user?.name || "Someone";
        // Use metadata if available (snapshot), otherwise fall back to relation (live data)
        const choreTitle = (log.metadata as any)?.choreTitle || log.chore?.title || "a chore";
        const chorePoints = (log.metadata as any)?.chorePoints || (log.chore as any)?.points;

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
            default:
                return <span>{userName} performed an action</span>;
        }
    };

    const renderItem = (item: any, index: number) => {
        const log = item as ActivityLog;
        return (
            <div key={log.id} className="flex items-start gap-3 text-sm border-b pb-3 last:border-0">
                <div className="mt-0.5">{getIcon(log.action)}</div>
                <div className="flex-1 space-y-1">
                    <p className="leading-none">{getMessage(log)}</p>
                    <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
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
                </div>
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
                columns="*, user:User(name), chore:Chore(title)"
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
