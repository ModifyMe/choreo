"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addDays,
    isBefore,
    isAfter,
    getDay,
} from "date-fns";
import { cn } from "@/lib/utils";

interface CalendarDialogProps {
    chores: any[];
    userId: string;
}

export function CalendarDialog({ chores, userId }: CalendarDialogProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [viewMode, setViewMode] = useState<"mine" | "all">("mine");

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const calendarDays = eachDayOfInterval({
        start: startDate,
        end: endDate,
    });

    // --- Projection Logic ---
    const getChoresForDate = (date: Date) => {
        const dayChores: any[] = [];

        // 1. Real Chores
        chores.forEach((chore) => {
            // Filter by viewMode
            if (viewMode === "mine" && chore.assignedToId !== userId) return;

            if (chore.dueDate && isSameDay(new Date(chore.dueDate), date)) {
                dayChores.push({ ...chore, isProjected: false });
            }
        });

        // 2. Projected Chores
        chores.forEach((chore) => {
            if (!chore.recurrence || chore.recurrence === "NONE") return;

            // Filter by viewMode for projected chores
            // Note: Projected chores are based on the original chore's assignment.
            // If the original chore is assigned to someone else, the projection is too.
            // (Unless we have complex rotation logic, but for now we assume same assignee or unassigned)
            if (viewMode === "mine" && chore.assignedToId !== userId) return;

            // Don't project if we have a real instance
            const hasRealInstance = dayChores.some(c => c.title === chore.title && !c.isProjected);
            if (hasRealInstance) return;

            // Check pattern
            let matches = false;
            // Base date for calculation (e.g. created at or last due date)
            // Ideally we project from "today" onwards.
            // If 'date' is in the past, don't project.
            if (isBefore(date, new Date())) return;

            if (chore.recurrence === "DAILY") {
                matches = true;
            } else if (chore.recurrence === "WEEKLY") {
                // Check if same day of week
                // We need to know the "start" day. Let's assume the current due date is the anchor.
                if (chore.dueDate) {
                    const dueDay = getDay(new Date(chore.dueDate));
                    if (getDay(date) === dueDay) matches = true;
                }
            } else if (chore.recurrence === "CUSTOM" && chore.recurrenceData) {
                try {
                    const days = JSON.parse(chore.recurrenceData) as string[];
                    const dayMap: { [key: string]: number } = {
                        "SUN": 0, "MON": 1, "TUE": 2, "WED": 3, "THU": 4, "FRI": 5, "SAT": 6
                    };
                    const currentDayName = format(date, "EEE").toUpperCase();
                    // date-fns format "EEE" gives "Mon", "Tue". We need to match with "MON", "TUE".
                    // Actually let's just use getDay() and map our days array to numbers.
                    const targetDay = getDay(date);
                    // Check if targetDay is in the allowed days
                    // We need to convert our strings "MON" to 1.
                    const allowedDays = days.map(d => dayMap[d]);
                    if (allowedDays.includes(targetDay)) matches = true;

                } catch (e) { }
            }

            if (matches) {
                dayChores.push({
                    ...chore,
                    id: `projected-${chore.id}-${date.toISOString()}`,
                    isProjected: true,
                    status: "PENDING"
                });
            }
        });

        return dayChores;
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="icon" title="Calendar View">
                    <CalendarIcon className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0">
                <div className="p-4 border-b flex items-center justify-between">
                    <DialogTitle className="flex items-center gap-2">
                        <CalendarIcon className="h-5 w-5" />
                        Chore Calendar
                    </DialogTitle>

                    <div className="flex items-center gap-4">
                        <div className="flex bg-muted rounded-lg p-1">
                            <button
                                onClick={() => setViewMode("mine")}
                                className={cn(
                                    "px-3 py-1 text-xs font-medium rounded-md transition-all",
                                    viewMode === "mine" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                My Chores
                            </button>
                            <button
                                onClick={() => setViewMode("all")}
                                className={cn(
                                    "px-3 py-1 text-xs font-medium rounded-md transition-all",
                                    viewMode === "all" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                All Chores
                            </button>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="icon" onClick={prevMonth}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="font-semibold min-w-[120px] text-center">
                                {format(currentMonth, "MMMM yyyy")}
                            </span>
                            <Button variant="outline" size="icon" onClick={nextMonth}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-auto p-4">
                    <div className="grid grid-cols-7 gap-px bg-muted rounded-lg overflow-hidden border">
                        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                            <div key={day} className="bg-background p-2 text-center text-sm font-medium text-muted-foreground">
                                {day}
                            </div>
                        ))}
                        {calendarDays.map((day, dayIdx) => {
                            const dayChores = getChoresForDate(day);
                            const isToday = isSameDay(day, new Date());
                            const isCurrentMonth = isSameMonth(day, currentMonth);

                            return (
                                <div
                                    key={day.toString()}
                                    className={cn(
                                        "bg-background min-h-[100px] p-2 flex flex-col gap-1 transition-colors hover:bg-muted/30",
                                        !isCurrentMonth && "bg-muted/10 text-muted-foreground",
                                        isToday && "bg-blue-50/50"
                                    )}
                                >
                                    <div className={cn(
                                        "text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1",
                                        isToday ? "bg-blue-600 text-white" : "text-muted-foreground"
                                    )}>
                                        {format(day, "d")}
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        {dayChores.map((chore) => (
                                            <div
                                                key={chore.id}
                                                className={cn(
                                                    "text-[10px] px-1.5 py-0.5 rounded border truncate flex items-center gap-1",
                                                    chore.isProjected
                                                        ? "border-dashed bg-muted/50 text-muted-foreground"
                                                        : chore.status === "COMPLETED"
                                                            ? "bg-green-50 text-green-700 border-green-200 line-through opacity-70"
                                                            : "bg-white border-border shadow-sm"
                                                )}
                                                title={`${chore.title} (${chore.points} XP)`}
                                            >
                                                {chore.isProjected && <RefreshCw className="w-2 h-2 shrink-0 opacity-50" />}
                                                {chore.title}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="p-4 border-t bg-muted/10 text-xs text-muted-foreground flex gap-4">
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-white border shadow-sm rounded"></div>
                        <span>Active Chore</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-muted/50 border border-dashed rounded"></div>
                        <span>Projected (Recurring)</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-green-50 border border-green-200 rounded"></div>
                        <span>Completed</span>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
