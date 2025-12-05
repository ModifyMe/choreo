"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Chore } from "./chore-context";
import { format, isToday, isTomorrow, isPast } from "date-fns";
import { Clock, User, Repeat, Calendar, Camera, Flame, CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChoreDetailDialogProps {
    chore: Chore;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ChoreDetailDialog({ chore, open, onOpenChange }: ChoreDetailDialogProps) {
    const isOverdue = chore.dueDate && isPast(new Date(chore.dueDate)) && !isToday(new Date(chore.dueDate));

    // Get readable recurrence text
    const getRecurrenceText = () => {
        if (!chore.recurrence || chore.recurrence === "NONE") return null;

        if (chore.recurrence === "CUSTOM" && chore.recurrenceData) {
            try {
                const days = JSON.parse(chore.recurrenceData) as string[];
                const dayNames: { [key: string]: string } = {
                    "SUN": "Sunday", "MON": "Monday", "TUE": "Tuesday", "WED": "Wednesday",
                    "THU": "Thursday", "FRI": "Friday", "SAT": "Saturday"
                };
                return days.map(d => dayNames[d.toUpperCase()] || d).join(", ");
            } catch {
                return "Custom";
            }
        }

        const recurrenceMap: { [key: string]: string } = {
            "DAILY": "Every day",
            "WEEKLY": "Every week",
            "MONTHLY": "Every month",
            "BI_MONTHLY": "Every 2 months"
        };
        return recurrenceMap[chore.recurrence] || chore.recurrence;
    };

    const formatDueDate = () => {
        if (!chore.dueDate) return null;
        const date = new Date(chore.dueDate);
        if (isToday(date)) return "Today";
        if (isTomorrow(date)) return "Tomorrow";
        return format(date, "EEEE, MMMM d, yyyy");
    };

    const visibleSteps = chore.steps?.filter(s => s.title !== "__CORRELATION__") || [];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[calc(100vw-2rem)] max-w-[500px] max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl">{chore.title}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 pt-2">
                    {/* Description */}
                    {chore.description && (
                        <div>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                {chore.description}
                            </p>
                        </div>
                    )}

                    {/* Info Grid */}
                    <div className="grid gap-3">
                        {/* Points */}
                        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                            <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full">
                                <span className="text-sm font-bold text-primary">⭐</span>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Points</p>
                                <p className="font-semibold">{chore.points} pts</p>
                            </div>
                        </div>

                        {/* Due Date */}
                        {chore.dueDate && (
                            <div className={cn(
                                "flex items-center gap-3 p-3 rounded-lg",
                                isOverdue ? "bg-red-50 dark:bg-red-950/30" : "bg-muted/50"
                            )}>
                                <div className={cn(
                                    "flex items-center justify-center w-8 h-8 rounded-full",
                                    isOverdue ? "bg-red-100 dark:bg-red-900/50" : "bg-primary/10"
                                )}>
                                    <Calendar className={cn("w-4 h-4", isOverdue ? "text-red-600" : "text-primary")} />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Due Date</p>
                                    <p className={cn("font-semibold", isOverdue && "text-red-600")}>
                                        {formatDueDate()}
                                        {chore.reminderTime && (
                                            <span className="ml-2 text-xs font-normal text-muted-foreground">
                                                at {chore.reminderTime}
                                            </span>
                                        )}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Recurrence */}
                        {chore.recurrence && chore.recurrence !== "NONE" && (
                            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                                <div className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-full">
                                    <Repeat className="w-4 h-4 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Repeats</p>
                                    <p className="font-semibold">{getRecurrenceText()}</p>
                                </div>
                            </div>
                        )}

                        {/* Assigned To */}
                        {chore.assignedTo && (
                            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                                <div className="flex items-center justify-center w-8 h-8 bg-green-100 dark:bg-green-900/50 rounded-full">
                                    <User className="w-4 h-4 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Assigned To</p>
                                    <p className="font-semibold">{chore.assignedTo.name || "Unknown"}</p>
                                </div>
                            </div>
                        )}

                        {/* Priority */}
                        {chore.priority && chore.priority !== "MEDIUM" && (
                            <div className={cn(
                                "flex items-center gap-3 p-3 rounded-lg",
                                chore.priority === "HIGH" ? "bg-orange-50 dark:bg-orange-950/30" : "bg-muted/50"
                            )}>
                                <div className={cn(
                                    "flex items-center justify-center w-8 h-8 rounded-full",
                                    chore.priority === "HIGH" ? "bg-orange-100 dark:bg-orange-900/50" : "bg-slate-100 dark:bg-slate-800"
                                )}>
                                    <Flame className={cn(
                                        "w-4 h-4",
                                        chore.priority === "HIGH" ? "text-orange-600" : "text-slate-500"
                                    )} />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Priority</p>
                                    <p className="font-semibold capitalize">{chore.priority.toLowerCase()}</p>
                                </div>
                            </div>
                        )}

                        {/* Requires Photo Proof */}
                        {chore.requireProof && (
                            <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                                <div className="flex items-center justify-center w-8 h-8 bg-purple-100 dark:bg-purple-900/50 rounded-full">
                                    <Camera className="w-4 h-4 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Verification</p>
                                    <p className="font-semibold">Photo proof required</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Subtasks */}
                    {visibleSteps.length > 0 && (
                        <div className="border-t pt-4">
                            <h4 className="text-sm font-semibold mb-3">
                                Subtasks ({visibleSteps.filter(s => s.completed).length}/{visibleSteps.length})
                            </h4>
                            <div className="space-y-2">
                                {visibleSteps.map((step) => (
                                    <div
                                        key={step.id}
                                        className={cn(
                                            "flex items-center gap-2 p-2 rounded-md",
                                            step.completed ? "bg-green-50 dark:bg-green-950/20" : "bg-muted/30"
                                        )}
                                    >
                                        {step.completed ? (
                                            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                                        ) : (
                                            <Circle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                        )}
                                        <span className={cn(
                                            "text-sm",
                                            step.completed && "line-through text-muted-foreground"
                                        )}>
                                            {step.title}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
