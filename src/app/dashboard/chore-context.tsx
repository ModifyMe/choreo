"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export interface Chore {
    id: string;
    title: string;
    description: string | null;
    points: number;
    assignedToId: string | null;
    status: string;
    dueDate: Date | null;
    recurrence: string | null;
    recurrenceData?: string | null;
    reminderTime?: string | null;
    priority?: "LOW" | "MEDIUM" | "HIGH";
    householdId: string;
    steps?: any;
    createdAt: Date;
    updatedAt: Date;
    assignedTo?: {
        name: string | null;
        image: string | null;
    } | null;
}

interface ChoreContextType {
    myChores: Chore[];
    availableChores: Chore[];
    householdChores: Chore[]; // Chores assigned to others
    addChore: (chore: Chore) => void;
    updateChore: (id: string, updates: Partial<Chore>) => void;
    deleteChore: (id: string) => void;
    moveChoreToMy: (id: string, userId: string) => void;
    completeChore: (id: string) => void;
    restoreChore: (id: string) => void;
    removeOptimisticChore: (id: string) => void;
    toggleSubtask: (choreId: string, stepId: string) => void;
}

const ChoreContext = createContext<ChoreContextType | undefined>(undefined);

export function ChoreProvider({
    children,
    initialChores,
    userId,
    householdId,
}: {
    children: React.ReactNode;
    initialChores: Chore[];
    userId: string;
    householdId: string;
}) {
    // Server state - Single Source of Truth
    const [serverChores, setServerChores] = useState<Chore[]>(initialChores);

    // Optimistic state
    const [pendingDeletes, setPendingDeletes] = useState<Set<string>>(new Set());
    const [optimisticAdds, setOptimisticAdds] = useState<Chore[]>([]);
    const [optimisticUpdates, setOptimisticUpdates] = useState<Map<string, Partial<Chore>>>(new Map());

    // Sync with server data
    useEffect(() => {
        setServerChores(initialChores);
    }, [initialChores]);

    // Real-time Subscription
    useEffect(() => {
        const channel = supabase
            .channel('realtime-chores')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'Chore',
                    filter: undefined,
                },
                (payload) => {
                    console.log('Real-time change received!', payload);

                    const record = payload.new || payload.old;
                    if (payload.eventType !== 'DELETE' && record && (record as any).householdId !== householdId) {
                        return;
                    }

                    if (payload.eventType === 'INSERT') {
                        const newChore = payload.new as Chore;
                        newChore.createdAt = new Date(newChore.createdAt);
                        newChore.updatedAt = new Date(newChore.updatedAt);
                        if (newChore.dueDate) newChore.dueDate = new Date(newChore.dueDate);

                        setServerChores((prev) => [newChore, ...prev]);

                    } else if (payload.eventType === 'UPDATE') {
                        const updatedChore = payload.new as Chore;
                        updatedChore.createdAt = new Date(updatedChore.createdAt);
                        updatedChore.updatedAt = new Date(updatedChore.updatedAt);
                        if (updatedChore.dueDate) updatedChore.dueDate = new Date(updatedChore.dueDate);

                        setServerChores((prev) => prev.map(c => c.id === updatedChore.id ? { ...c, ...updatedChore } : c));

                        // If it wasn't in the list (e.g. moved from another household? unlikely but possible), add it
                        setServerChores((prev) => {
                            if (!prev.some(c => c.id === updatedChore.id)) {
                                return [updatedChore, ...prev];
                            }
                            return prev;
                        });

                    } else if (payload.eventType === 'DELETE') {
                        const deletedId = payload.old.id;
                        setServerChores((prev) => prev.filter((c) => c.id !== deletedId));
                    }
                }
            )
            .subscribe((status) => {
                console.log(`Real-time subscription status: ${status}`);
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [householdId]);

    // Cleanup confirmed actions
    useEffect(() => {
        // Cleanup Pending Deletes
        setPendingDeletes(prev => {
            const next = new Set(prev);
            let changed = false;
            for (const id of prev) {
                const exists = serverChores.some(c => c.id === id);
                if (!exists) {
                    next.delete(id);
                    changed = true;
                }
            }
            return changed ? next : prev;
        });

        // Cleanup Optimistic Adds
        setOptimisticAdds(prev => {
            const next = prev.filter(add => {
                const matchFound = serverChores.some(serverChore => {
                    if (serverChore.id === add.id) return true;
                    return (
                        serverChore.title === add.title &&
                        serverChore.points === add.points &&
                        serverChore.recurrence === add.recurrence
                    );
                });
                return !matchFound;
            });
            return next.length !== prev.length ? next : prev;
        });
    }, [serverChores]);

    // Derived State Calculation
    const { myChores, availableChores, householdChores } = React.useMemo(() => {
        // 1. Combine all known chores
        let allChores = [...serverChores];

        // 2. Add Optimistic Adds (deduplicated by ID)
        const serverIds = new Set(allChores.map(c => c.id));
        const uniqueAdds = optimisticAdds.filter(c => !serverIds.has(c.id));
        allChores = [...allChores, ...uniqueAdds];

        // 3. Apply Optimistic Updates
        allChores = allChores.map(chore => {
            if (optimisticUpdates.has(chore.id)) {
                return { ...chore, ...optimisticUpdates.get(chore.id) };
            }
            return chore;
        });

        // 4. Filter Pending Deletes
        allChores = allChores.filter(chore => !pendingDeletes.has(chore.id));

        // 5. Split lists
        const my = allChores.filter(c => c.assignedToId === userId && c.status === "PENDING");
        const available = allChores.filter(c => c.assignedToId === null && c.status === "PENDING");
        const household = allChores.filter(c => c.assignedToId !== null && c.assignedToId !== userId && c.status === "PENDING");

        const sortByCreated = (a: Chore, b: Chore) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

        return {
            myChores: my.sort(sortByCreated),
            availableChores: available.sort(sortByCreated),
            householdChores: household.sort(sortByCreated),
        };
    }, [serverChores, optimisticAdds, optimisticUpdates, pendingDeletes, userId]);


    const addChore = useCallback((chore: Chore) => {
        setOptimisticAdds((prev) => [...prev, chore]);
    }, []);

    const updateChore = useCallback((id: string, updates: Partial<Chore>) => {
        setOptimisticUpdates((prev) => {
            const next = new Map(prev);
            const existing = next.get(id) || {};
            next.set(id, { ...existing, ...updates });
            return next;
        });
    }, []);

    const deleteChore = useCallback((id: string) => {
        setPendingDeletes((prev) => {
            const next = new Set(prev);
            next.add(id);
            return next;
        });
    }, []);

    const moveChoreToMy = useCallback((id: string, targetUserId: string) => {
        updateChore(id, { assignedToId: targetUserId });
    }, [updateChore]);

    const completeChore = useCallback((id: string) => {
        const allChores = [...serverChores, ...optimisticAdds];
        const chore = allChores.find(c => c.id === id);

        if (chore && chore.recurrence && chore.recurrence !== "NONE") {
            const nextDueDate = new Date();
            if (chore.recurrence === "DAILY") nextDueDate.setDate(nextDueDate.getDate() + 1);
            else if (chore.recurrence === "WEEKLY") nextDueDate.setDate(nextDueDate.getDate() + 7);
            else if (chore.recurrence === "MONTHLY") nextDueDate.setMonth(nextDueDate.getMonth() + 1);
            else if (chore.recurrence === "BI_MONTHLY") nextDueDate.setMonth(nextDueDate.getMonth() + 2);
            else nextDueDate.setDate(nextDueDate.getDate() + 7);

            const nextChore: Chore = {
                ...chore,
                id: `temp-${Date.now()}`,
                dueDate: nextDueDate,
                status: "PENDING",
                createdAt: new Date(),
                updatedAt: new Date(),
                steps: chore.steps ? (chore.steps as any[]).map((s: any) => ({ ...s, completed: false })) : undefined
            };

            addChore(nextChore);
        }

        updateChore(id, { status: "COMPLETED" });
    }, [serverChores, optimisticAdds, updateChore, addChore]);

    const restoreChore = useCallback((id: string) => {
        setPendingDeletes((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
        });
    }, []);

    const removeOptimisticChore = useCallback((id: string) => {
        setOptimisticAdds((prev) => prev.filter((c) => c.id !== id));
    }, []);

    const toggleSubtask = useCallback((choreId: string, stepId: string) => {
        const allChores = [...serverChores, ...optimisticAdds];
        let chore = allChores.find(c => c.id === choreId);

        if (optimisticUpdates.has(choreId)) {
            const updates = optimisticUpdates.get(choreId);
            if (chore && updates) {
                chore = { ...chore, ...updates };
            }
        }

        if (!chore || !chore.steps) return;

        const newSteps = (chore.steps as any[]).map(step =>
            step.id === stepId ? { ...step, completed: !step.completed } : step
        );

        updateChore(choreId, { steps: newSteps });

        fetch(`/api/chores/${choreId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "TOGGLE_STEP", stepId }),
        }).catch(err => {
            console.error("Failed to toggle subtask", err);
        });
    }, [serverChores, optimisticAdds, optimisticUpdates, updateChore]);

    return (
        <ChoreContext.Provider
            value={{
                myChores,
                availableChores,
                householdChores,
                addChore,
                updateChore,
                deleteChore,
                moveChoreToMy,
                completeChore,
                restoreChore,
                removeOptimisticChore,
                toggleSubtask,
            }}
        >
            {children}
        </ChoreContext.Provider>
    );
}

export function useChores() {
    const context = useContext(ChoreContext);
    if (context === undefined) {
        throw new Error("useChores must be used within a ChoreProvider");
    }
    return context;
}
