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
    householdId: string;
    createdAt: Date;
    updatedAt: Date;
}

interface ChoreContextType {
    myChores: Chore[];
    availableChores: Chore[];
    addChore: (chore: Chore) => void;
    updateChore: (id: string, updates: Partial<Chore>) => void;
    deleteChore: (id: string) => void;
    moveChoreToMy: (id: string, userId: string) => void;
    completeChore: (id: string) => void;
    restoreChore: (id: string) => void;
    removeOptimisticChore: (id: string) => void;
}

const ChoreContext = createContext<ChoreContextType | undefined>(undefined);

export function ChoreProvider({
    children,
    initialMyChores,
    initialAvailableChores,
    userId,
    householdId,
}: {
    children: React.ReactNode;
    initialMyChores: Chore[];
    initialAvailableChores: Chore[];
    userId: string;
    householdId: string;
}) {
    // Server state
    const [serverMyChores, setServerMyChores] = useState<Chore[]>(initialMyChores);
    const [serverAvailableChores, setServerAvailableChores] = useState<Chore[]>(initialAvailableChores);

    // Optimistic state
    const [pendingDeletes, setPendingDeletes] = useState<Set<string>>(new Set());
    const [optimisticAdds, setOptimisticAdds] = useState<Chore[]>([]);
    const [optimisticUpdates, setOptimisticUpdates] = useState<Map<string, Partial<Chore>>>(new Map());

    // Sync with server data
    useEffect(() => {
        setServerMyChores(initialMyChores);
        setServerAvailableChores(initialAvailableChores);
    }, [initialMyChores, initialAvailableChores]);

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
                    filter: `householdId=eq.${householdId}`,
                },
                (payload) => {
                    console.log('Real-time change received!', payload);

                    if (payload.eventType === 'INSERT') {
                        const newChore = payload.new as Chore;
                        // Convert dates from string to Date object if needed
                        newChore.createdAt = new Date(newChore.createdAt);
                        newChore.updatedAt = new Date(newChore.updatedAt);
                        if (newChore.dueDate) newChore.dueDate = new Date(newChore.dueDate);

                        if (newChore.assignedToId === userId) {
                            setServerMyChores((prev) => [newChore, ...prev]);
                        } else if (!newChore.assignedToId) {
                            setServerAvailableChores((prev) => [newChore, ...prev]);
                        }
                    } else if (payload.eventType === 'UPDATE') {
                        const updatedChore = payload.new as Chore;
                        updatedChore.createdAt = new Date(updatedChore.createdAt);
                        updatedChore.updatedAt = new Date(updatedChore.updatedAt);
                        if (updatedChore.dueDate) updatedChore.dueDate = new Date(updatedChore.dueDate);

                        // Remove from both lists first to handle re-assignment
                        setServerMyChores((prev) => prev.filter((c) => c.id !== updatedChore.id));
                        setServerAvailableChores((prev) => prev.filter((c) => c.id !== updatedChore.id));

                        // Add back to correct list
                        if (updatedChore.assignedToId === userId) {
                            setServerMyChores((prev) => [updatedChore, ...prev]);
                        } else if (!updatedChore.assignedToId) {
                            setServerAvailableChores((prev) => [updatedChore, ...prev]);
                        }
                    } else if (payload.eventType === 'DELETE') {
                        const deletedId = payload.old.id;
                        setServerMyChores((prev) => prev.filter((c) => c.id !== deletedId));
                        setServerAvailableChores((prev) => prev.filter((c) => c.id !== deletedId));
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [householdId, userId]);

    // Cleanup confirmed actions
    useEffect(() => {
        // Cleanup Pending Deletes
        setPendingDeletes(prev => {
            const next = new Set(prev);
            let changed = false;
            for (const id of prev) {
                const inMy = serverMyChores.some(c => c.id === id);
                const inAvail = serverAvailableChores.some(c => c.id === id);
                // If it's gone from server data, it's confirmed deleted
                if (!inMy && !inAvail) {
                    next.delete(id);
                    changed = true;
                }
            }
            return changed ? next : prev;
        });

        // Cleanup Optimistic Adds
        setOptimisticAdds(prev => {
            const next = prev.filter(add => {
                const allServerChores = [...serverMyChores, ...serverAvailableChores];

                const matchFound = allServerChores.some(serverChore => {
                    // 1. Direct ID match (rare for creates, common for updates)
                    if (serverChore.id === add.id) return true;

                    // 2. Content match (for creates where ID differs)
                    // We check title, points, and recurrence to be reasonably sure it's the same chore
                    return (
                        serverChore.title === add.title &&
                        serverChore.points === add.points &&
                        serverChore.recurrence === add.recurrence
                    );
                });

                // Keep the optimistic add only if NO match is found in server data
                return !matchFound;
            });
            return next.length !== prev.length ? next : prev;
        });
    }, [serverMyChores, serverAvailableChores]);

    // Derived State Calculation
    const { myChores, availableChores } = React.useMemo(() => {
        // 1. Combine all known chores
        let allChores = [...serverMyChores, ...serverAvailableChores];

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

        // 5. Split back into lists based on assignment and status
        const my = allChores.filter(c => c.assignedToId === userId && c.status === "PENDING");
        const available = allChores.filter(c => c.assignedToId === null && c.status === "PENDING");

        // Sort by createdAt desc (or maintain original order?)
        // Server returns desc, so we should probably sort.
        // But updates might change order if we sort by updated?
        // Let's stick to createdAt for now as per original query.
        const sortByCreated = (a: Chore, b: Chore) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

        return {
            myChores: my.sort(sortByCreated),
            availableChores: available.sort(sortByCreated)
        };
    }, [serverMyChores, serverAvailableChores, optimisticAdds, optimisticUpdates, pendingDeletes, userId]);


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
        updateChore(id, { status: "COMPLETED" });
    }, [updateChore]);

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

    return (
        <ChoreContext.Provider
            value={{
                myChores,
                availableChores,
                addChore,
                updateChore,
                deleteChore,
                moveChoreToMy,
                completeChore,
                restoreChore,
                removeOptimisticChore,
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
