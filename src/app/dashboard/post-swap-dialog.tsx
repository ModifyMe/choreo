"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState, useMemo } from "react";
import { ArrowLeftRight, Loader2, ChevronDown, ChevronRight, Check, X } from "lucide-react";
import { toast } from "sonner";
import { useChores, Chore } from "./chore-context";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface PostSwapDialogProps {
    chore: Chore;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

interface MemberChores {
    userId: string;
    name: string;
    image: string | null;
    chores: Chore[];
}

export function PostSwapDialog({ chore, open, onOpenChange }: PostSwapDialogProps) {
    const { householdChores } = useChores();
    const [wantedDescription, setWantedDescription] = useState("");
    const [selectedChoreIds, setSelectedChoreIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);
    const [expandedMemberIds, setExpandedMemberIds] = useState<Set<string>>(new Set());
    const router = useRouter();

    // Group chores by member
    const memberChoresList = useMemo(() => {
        const memberMap = new Map<string, MemberChores>();

        householdChores.forEach((c) => {
            if (!c.assignedToId) return;

            if (!memberMap.has(c.assignedToId)) {
                memberMap.set(c.assignedToId, {
                    userId: c.assignedToId,
                    name: c.assignedTo?.name || "Unknown",
                    image: c.assignedTo?.image || null,
                    chores: [],
                });
            }
            memberMap.get(c.assignedToId)!.chores.push(c);
        });

        return Array.from(memberMap.values()).sort((a, b) =>
            a.name.localeCompare(b.name)
        );
    }, [householdChores]);

    const toggleMemberExpand = (memberId: string) => {
        setExpandedMemberIds((prev) => {
            const next = new Set(prev);
            if (next.has(memberId)) {
                next.delete(memberId);
            } else {
                next.add(memberId);
            }
            return next;
        });
    };

    const toggleChoreSelection = (choreId: string) => {
        setSelectedChoreIds((prev) => {
            const next = new Set(prev);
            if (next.has(choreId)) {
                next.delete(choreId);
            } else {
                next.add(choreId);
            }
            return next;
        });
    };

    const clearAllSelections = () => {
        setSelectedChoreIds(new Set());
    };

    const selectedChores = useMemo(() => {
        return householdChores.filter((c) => selectedChoreIds.has(c.id));
    }, [householdChores, selectedChoreIds]);

    const handleSubmit = async () => {
        // Validation: need either selected chores OR a description
        if (selectedChoreIds.size === 0 && !wantedDescription.trim()) {
            toast.error("Please select chores or describe what you want in return");
            return;
        }

        setLoading(true);
        try {
            // If multiple chores selected, auto-generate description
            let description = wantedDescription.trim();
            if (selectedChoreIds.size > 0 && !description) {
                description = `Looking for: ${selectedChores.map(c => c.title).join(", ")}`;
            }

            const res = await fetch("/api/swaps", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    offeredChoreId: chore.id,
                    wantedDescription: description,
                    // If single chore selected, use as specific wanted chore
                    wantedChoreId: selectedChoreIds.size === 1 ? Array.from(selectedChoreIds)[0] : undefined,
                }),
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || "Failed to post swap");
            }

            toast.success("Swap offer posted!");
            onOpenChange(false);
            setWantedDescription("");
            setSelectedChoreIds(new Set());
            setExpandedMemberIds(new Set());
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || "Failed to post swap offer");
        } finally {
            setLoading(false);
        }
    };

    const hasReachedLimit = (chore.swapOfferCount ?? 0) >= 2;
    const isValid = selectedChoreIds.size > 0 || wantedDescription.trim().length > 0;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[calc(100vw-2rem)] max-w-[500px] max-h-[85vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ArrowLeftRight className="h-5 w-5" />
                        Post Swap Offer
                    </DialogTitle>
                    <DialogDescription>
                        Offer "{chore.title}" for trade on the swap board.
                    </DialogDescription>
                </DialogHeader>

                {hasReachedLimit ? (
                    <div className="py-6 text-center">
                        <p className="text-muted-foreground">
                            This chore has already been posted to the swap board twice.
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
                            Each chore can only be offered for swap up to 2 times.
                        </p>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto space-y-4 pt-2">
                        {/* What you're offering */}
                        <div className="p-3 bg-muted/50 rounded-md">
                            <p className="text-xs text-muted-foreground mb-1">You're offering:</p>
                            <p className="font-medium">{chore.title}</p>
                            <p className="text-sm text-muted-foreground">{chore.points} XP</p>
                        </div>

                        {/* Selected chores display */}
                        {selectedChoreIds.size > 0 && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label>Selected chores ({selectedChoreIds.size})</Label>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={clearAllSelections}
                                        className="h-7 text-xs"
                                    >
                                        <X className="h-3 w-3 mr-1" />
                                        Clear all
                                    </Button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {selectedChores.map((c) => (
                                        <Badge
                                            key={c.id}
                                            variant="secondary"
                                            className="flex items-center gap-1 pr-1 cursor-pointer hover:bg-destructive/20"
                                            onClick={() => toggleChoreSelection(c.id)}
                                        >
                                            {c.title}
                                            <X className="h-3 w-3" />
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Member chore picker */}
                        {memberChoresList.length > 0 && (
                            <div className="space-y-2">
                                <Label>Select chores you'd accept in return</Label>
                                <p className="text-xs text-muted-foreground">
                                    Select multiple chores to increase your chances of a swap!
                                </p>
                                <div className="border rounded-lg max-h-[200px] overflow-y-auto">
                                    {memberChoresList.map((member) => {
                                        const isExpanded = expandedMemberIds.has(member.userId);
                                        const selectedCount = member.chores.filter(c => selectedChoreIds.has(c.id)).length;

                                        return (
                                            <div key={member.userId} className="border-b last:border-b-0">
                                                {/* Member Header */}
                                                <div
                                                    className={cn(
                                                        "flex items-center justify-between p-2 cursor-pointer hover:bg-muted/50 transition-colors",
                                                        isExpanded && "bg-muted/30"
                                                    )}
                                                    onClick={() => toggleMemberExpand(member.userId)}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <Avatar className="h-7 w-7 border">
                                                            <AvatarImage src={member.image || undefined} />
                                                            <AvatarFallback className="text-xs">{member.name?.[0] || "?"}</AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="text-sm font-medium leading-none">{member.name}</p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {member.chores.length} chore{member.chores.length !== 1 ? "s" : ""}
                                                                {selectedCount > 0 && (
                                                                    <span className="text-primary ml-1">• {selectedCount} selected</span>
                                                                )}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    {isExpanded ? (
                                                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                                    ) : (
                                                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                                    )}
                                                </div>

                                                {/* Chores List */}
                                                {isExpanded && (
                                                    <div className="bg-muted/10 border-t">
                                                        {member.chores.map((c) => {
                                                            const isSelected = selectedChoreIds.has(c.id);
                                                            return (
                                                                <div
                                                                    key={c.id}
                                                                    className={cn(
                                                                        "flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-muted/40 transition-colors border-b last:border-b-0",
                                                                        isSelected && "bg-primary/10"
                                                                    )}
                                                                    onClick={() => toggleChoreSelection(c.id)}
                                                                >
                                                                    <div className={cn(
                                                                        "w-5 h-5 rounded border flex items-center justify-center shrink-0",
                                                                        isSelected ? "bg-primary border-primary" : "border-muted-foreground/30"
                                                                    )}>
                                                                        {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-sm truncate">{c.title}</p>
                                                                        <p className="text-xs text-muted-foreground">{c.points} XP</p>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Description - optional if chores selected */}
                        <div className="space-y-2">
                            <Label htmlFor="wanted">
                                {selectedChoreIds.size > 0
                                    ? "Additional notes (optional)"
                                    : "What do you want in return?"}
                            </Label>
                            <Textarea
                                id="wanted"
                                placeholder={
                                    selectedChoreIds.size > 0
                                        ? "Any additional details..."
                                        : "e.g., I'll do your dishes tomorrow..."
                                }
                                value={wantedDescription}
                                onChange={(e) => setWantedDescription(e.target.value)}
                                className="min-h-[60px]"
                            />
                            {selectedChoreIds.size === 0 && (
                                <p className="text-xs text-muted-foreground">
                                    Required if no chores are selected
                                </p>
                            )}
                        </div>

                        {/* Swap count warning */}
                        {(chore.swapOfferCount ?? 0) === 1 && (
                            <p className="text-xs text-amber-600">
                                ⚠️ This is your last swap attempt for this chore.
                            </p>
                        )}
                    </div>
                )}

                {!hasReachedLimit && (
                    <div className="pt-4 border-t mt-2">
                        <Button
                            onClick={handleSubmit}
                            disabled={loading || !isValid}
                            className="w-full"
                        >
                            {loading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <>
                                    <ArrowLeftRight className="h-4 w-4 mr-2" />
                                    Post to Swap Board
                                </>
                            )}
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
