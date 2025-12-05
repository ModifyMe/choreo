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
import { useState } from "react";
import { Users, ChevronDown, ChevronUp, CheckCircle, Circle } from "lucide-react";
import { useChores } from "./chore-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

export function HouseholdChoresDialog() {
    const { householdChores } = useChores();
    const [expandedChoreIds, setExpandedChoreIds] = useState<Set<string>>(new Set());

    const toggleExpand = (choreId: string) => {
        setExpandedChoreIds((prev) => {
            const next = new Set(prev);
            if (next.has(choreId)) {
                next.delete(choreId);
            } else {
                next.add(choreId);
            }
            return next;
        });
    };

    return (
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
                        Chores currently claimed by other members.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                    {householdChores.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground italic">
                            No active chores for other members.
                        </div>
                    ) : (
                        householdChores.map((chore) => {
                            const isExpanded = expandedChoreIds.has(chore.id);
                            const hasSteps = chore.steps && Array.isArray(chore.steps) && chore.steps.length > 0;

                            return (
                                <div key={chore.id} className="border rounded-lg bg-muted/30 overflow-hidden">
                                    <div
                                        className={cn(
                                            "flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 transition-colors",
                                            isExpanded && "bg-muted/50"
                                        )}
                                        onClick={() => hasSteps && toggleExpand(chore.id)}
                                    >
                                        <div className="space-y-1">
                                            <p className="font-medium leading-none">{chore.title}</p>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <span>{chore.points} XP</span>
                                                <span>•</span>
                                                <span>{formatDistanceToNow(new Date(chore.createdAt), { addSuffix: true })}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-muted-foreground hidden sm:inline-block">
                                                    {chore.assignedTo?.name || "Unknown"}
                                                </span>
                                                <Avatar className="h-8 w-8 border">
                                                    <AvatarImage src={chore.assignedTo?.image || undefined} className="object-cover" />
                                                    <AvatarFallback>{chore.assignedTo?.name?.[0] || "?"}</AvatarFallback>
                                                </Avatar>
                                            </div>
                                            {hasSteps && (
                                                <Button variant="ghost" size="icon" className="h-6 w-6 ml-1">
                                                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    {isExpanded && hasSteps && (
                                        <div className="px-3 pb-3 pt-1 border-t border-dashed">
                                            <p className="text-xs font-medium text-muted-foreground mb-2 mt-2">Subtasks</p>
                                            <div className="space-y-1">
                                                {chore.steps?.map((step) => (
                                                    <div key={step.id} className="flex items-center gap-2 text-sm">
                                                        {step.completed ? (
                                                            <CheckCircle className="h-3 w-3 text-primary" />
                                                        ) : (
                                                            <Circle className="h-3 w-3 text-muted-foreground" />
                                                        )}
                                                        <span className={cn(step.completed && "text-muted-foreground line-through")}>
                                                            {step.title}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
