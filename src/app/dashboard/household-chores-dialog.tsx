"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { useState, useMemo } from "react";
import { Users, ChevronDown, ChevronRight, CheckCircle, Circle } from "lucide-react";
import { useChores, Chore } from "./chore-context";
import { ChoreDetailDialog } from "./chore-detail-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface MemberChores {
    userId: string;
    name: string;
    image: string | null;
    chores: Chore[];
}

export function HouseholdChoresDialog() {
    const { householdChores, members } = useChores();
    const [expandedMemberIds, setExpandedMemberIds] = useState<Set<string>>(new Set());
    const [selectedChore, setSelectedChore] = useState<Chore | null>(null);
    const [detailOpen, setDetailOpen] = useState(false);

    // Group chores by member
    const memberChoresList = useMemo(() => {
        const memberMap = new Map<string, MemberChores>();

        householdChores.forEach((chore) => {
            if (!chore.assignedToId) return;

            if (!memberMap.has(chore.assignedToId)) {
                memberMap.set(chore.assignedToId, {
                    userId: chore.assignedToId,
                    name: chore.assignedTo?.name || "Unknown",
                    image: chore.assignedTo?.image || null,
                    chores: [],
                });
            }
            memberMap.get(chore.assignedToId)!.chores.push(chore);
        });

        // Sort by name
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

    const openChoreDetail = (chore: Chore) => {
        setSelectedChore(chore);
        setDetailOpen(true);
    };

    const getTotalPoints = (chores: Chore[]) =>
        chores.reduce((sum, c) => sum + c.points, 0);

    return (
        <>
            <Dialog>
                <DialogTrigger asChild>
                    <Button variant="outline" size="icon" title="Household Chores">
                        <Users className="h-4 w-4" />
                    </Button>
                </DialogTrigger>
                <DialogContent className="w-[calc(100vw-2rem)] max-w-[425px] max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Household Chores</DialogTitle>
                        <DialogDescription>
                            See what everyone is working on.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                        {memberChoresList.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground italic">
                                No active chores for other members.
                            </div>
                        ) : (
                            memberChoresList.map((member) => {
                                const isExpanded = expandedMemberIds.has(member.userId);

                                return (
                                    <div key={member.userId} className="border rounded-lg overflow-hidden">
                                        {/* Member Header */}
                                        <div
                                            className={cn(
                                                "flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 transition-colors",
                                                isExpanded && "bg-muted/50 border-b"
                                            )}
                                            onClick={() => toggleMemberExpand(member.userId)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-10 w-10 border">
                                                    <AvatarImage src={member.image || undefined} className="object-cover" />
                                                    <AvatarFallback>{member.name?.[0] || "?"}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium leading-none">{member.name}</p>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        {member.chores.length} chore{member.chores.length !== 1 ? "s" : ""} • {getTotalPoints(member.chores)} XP
                                                    </p>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                {isExpanded ? (
                                                    <ChevronDown className="h-4 w-4" />
                                                ) : (
                                                    <ChevronRight className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </div>

                                        {/* Chores List */}
                                        {isExpanded && (
                                            <div className="bg-muted/20">
                                                {member.chores.map((chore, index) => {
                                                    const hasSteps = chore.steps && Array.isArray(chore.steps) && chore.steps.length > 0;
                                                    const completedSteps = hasSteps ? chore.steps!.filter(s => s.completed).length : 0;
                                                    const totalSteps = hasSteps ? chore.steps!.length : 0;

                                                    return (
                                                        <div
                                                            key={chore.id}
                                                            className={cn(
                                                                "flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/40 transition-colors",
                                                                index < member.chores.length - 1 && "border-b border-dashed"
                                                            )}
                                                            onClick={() => openChoreDetail(chore)}
                                                        >
                                                            <div className="space-y-1 min-w-0 flex-1">
                                                                <p className="font-medium text-sm truncate">{chore.title}</p>
                                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                                    <span>{chore.points} XP</span>
                                                                    {chore.dueDate && (
                                                                        <>
                                                                            <span>•</span>
                                                                            <span>Due {formatDistanceToNow(new Date(chore.dueDate), { addSuffix: true })}</span>
                                                                        </>
                                                                    )}
                                                                    {hasSteps && (
                                                                        <>
                                                                            <span>•</span>
                                                                            <span className="flex items-center gap-1">
                                                                                {completedSteps === totalSteps ? (
                                                                                    <CheckCircle className="h-3 w-3 text-green-500" />
                                                                                ) : (
                                                                                    <Circle className="h-3 w-3" />
                                                                                )}
                                                                                {completedSteps}/{totalSteps}
                                                                            </span>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Chore Detail Dialog */}
            {selectedChore && (
                <ChoreDetailDialog
                    chore={selectedChore}
                    open={detailOpen}
                    onOpenChange={setDetailOpen}
                />
            )}
        </>
    );
}
