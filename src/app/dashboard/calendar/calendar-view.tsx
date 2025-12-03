"use client";

import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { useChores } from "../chore-context";
import { ChoreCard } from "../chore-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isSameDay, parseISO } from "date-fns";
import { toast } from "sonner";
import { runSideCannons } from "@/lib/confetti";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export function CalendarView({ userId }: { userId: string }) {
    const { myChores, availableChores, moveChoreToMy, completeChore, deleteChore, restoreChore, toggleSubtask } = useChores();
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const router = useRouter();

    // Combine all chores for calendar display
    const allChores = [...myChores, ...availableChores];

    // Function to check if a day has chores
    const hasChores = (day: Date) => {
        return allChores.some(chore => chore.dueDate && isSameDay(new Date(chore.dueDate), day));
    };

    // Filter chores for selected date
    const selectedChores = date
        ? allChores.filter(chore => chore.dueDate && isSameDay(new Date(chore.dueDate), date))
        : [];

    const handleAction = async (choreId: string, action: "CLAIM" | "COMPLETE", proofUrl?: string) => {
        setLoadingId(choreId);

        if (action === "CLAIM") {
            moveChoreToMy(choreId, userId);
            toast.success("Chore claimed!");
        } else if (action === "COMPLETE") {
            completeChore(choreId);
            toast.success("Chore completed! 🎉");
            runSideCannons();
        }

        try {
            const res = await fetch(`/api/chores/${choreId}`, {
                method: "PATCH",
                body: JSON.stringify({ action, proofImage: proofUrl }),
            });

            if (!res.ok) {
                const error = await res.text();
                throw new Error(error);
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Something went wrong");
            router.refresh();
        } finally {
            setLoadingId(null);
        }
    };

    // Dummy handlers for edit/delete as we might not want full management here or just simple ones
    // For now, we can pass empty functions or implement them if needed.
    // Let's implement simple delete for consistency if we want full feature parity.
    const handleDelete = async (choreId: string) => {
        // Implement if needed, or just warn
        toast.error("Please delete chores from the main list.");
    };

    const handleEdit = (chore: any) => {
        // Implement if needed
        toast.info("Please edit chores from the main list.");
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-1">
                <CardHeader>
                    <CardTitle>Calendar</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center">
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        className="rounded-md border"
                        modifiers={{
                            hasChore: (day) => hasChores(day),
                        }}
                        modifiersStyles={{
                            hasChore: { fontWeight: 'bold', textDecoration: 'underline', color: 'var(--primary)' }
                        }}
                    />
                </CardContent>
            </Card>

            <Card className="md:col-span-2">
                <CardHeader>
                    <CardTitle>
                        Chores for {date?.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {selectedChores.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground border border-dashed rounded-lg">
                            No chores for this day.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {selectedChores.map(chore => (
                                <ChoreCard
                                    key={chore.id}
                                    chore={chore}
                                    userId={userId}
                                    type={chore.assignedToId === userId ? "my" : "available"}
                                    onAction={handleAction}
                                    onToggleSubtask={toggleSubtask}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                    loadingId={loadingId}
                                />
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
