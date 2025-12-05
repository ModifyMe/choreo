"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export interface Step {
    id: string;
    title: string;
    completed: boolean;
}

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
    requireProof?: boolean;
    householdId: string;
    steps?: Step[];
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
    members: any[];
    userRole: "ADMIN" | "MEMBER";
}

const ChoreContext = createContext<ChoreContextType | undefined>(undefined);

export function ChoreProvider({
    children,
    initialChores = [],
    userId,
    householdId,
    members = [],
    userRole = "MEMBER",
}: {
    children: React.ReactNode;
    initialChores: Chore[];
    userId: string;
    householdId: string;
    members?: any[];
    userRole?: "ADMIN" | "MEMBER";
}) {
    // Server state - Single Source of Truth
    const [serverChores, setServerChores] = useState<Chore[]>(initialChores || []);

    // Optimistic state
    const [pendingDeletes, setPendingDeletes] = useState<Set<string>>(new Set());
    const [optimisticAdds, setOptimisticAdds] = useState<Chore[]>([]);
    const [optimisticUpdates, setOptimisticUpdates] = useState<Map<string, Partial<Chore>>>(new Map());

    // Debounce refs for batching rapid real-time updates
    const updateQueueRef = useRef<Map<string, Chore>>(new Map());
    const insertQueueRef = useRef<Map<string, Chore>>(new Map());
    const deleteQueueRef = useRef<Set<string>>(new Set());
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const DEBOUNCE_MS = 100; // Batch updates within 100ms window

    // Sync with server data
    useEffect(() => {
        setServerChores(initialChores || []);
    }, [initialChores]);

    // Reconciliation: Cleanup optimistic adds when server chores arrive
    useEffect(() => {
        if (optimisticAdds.length === 0) return;

        setOptimisticAdds(prev => {
            const next = prev.filter(optimistic => {
                // Check if this optimistic chore now exists in server chores
                const match = serverChores.find(server => {
                    // 1. Match by ID (exact)
                    if (server.id === optimistic.id) return true;

                    // 2. Match by Correlation ID (Robust)
                    if (Array.isArray(server.steps)) {
                        const correlationStep = server.steps.find((s: any) => s.title === "__CORRELATION__");
                        if (correlationStep && correlationStep.id === `cid-${optimistic.id}`) {
                            return true;
                        }
                    }

                    // 3. Heuristic: Same title and created recently (within 60s)
                    const sameTitle = server.title === optimistic.title;
                    const timeDiff = Math.abs(new Date(server.createdAt).getTime() - new Date(optimistic.createdAt).getTime());
                    return sameTitle && timeDiff < 60000;
                });

                // Keep it only if NO match found
                return !match;
            });

            if (next.length === prev.length) return prev;
            return next;
        });
    }, [serverChores, optimisticAdds]);

    // Flush queued updates to state (called after debounce delay)
    const flushUpdateQueue = useCallback(() => {
        const inserts = Array.from(insertQueueRef.current.values());
        const updates = Array.from(updateQueueRef.current.values());
        const deletes = Array.from(deleteQueueRef.current);

        // Clear queues
        insertQueueRef.current.clear();
        updateQueueRef.current.clear();
        deleteQueueRef.current.clear();

        // Batch all state changes
        if (inserts.length > 0 || updates.length > 0 || deletes.length > 0) {
            setServerChores((prev) => {
                let next = [...prev];

                // Apply inserts (skip duplicates and only add PENDING chores)
                inserts.forEach((chore) => {
                    if (chore.status !== "PENDING") return;

                    // Check for duplicates by ID
                    if (next.some((c) => c.id === chore.id)) return;

                    // Check for duplicates by title + same due date (for recurring chores)
                    const choreDueDate = chore.dueDate ? new Date(chore.dueDate).toDateString() : null;
                    const choreCreatedAt = new Date(chore.createdAt).getTime();

                    if (next.some((c) => {
                        if (c.title !== chore.title) return false;
                        const cDueDate = c.dueDate ? new Date(c.dueDate).toDateString() : null;

                        // If both have due dates, compare them
                        if (choreDueDate && cDueDate) return choreDueDate === cDueDate;

                        // If neither has due date, check if created within 60 seconds
                        if (!choreDueDate && !cDueDate) {
                            const timeDiff = Math.abs(new Date(c.createdAt).getTime() - choreCreatedAt);
                            return timeDiff < 60000;
                        }

                        return false;
                    })) return;

                    next.push(chore);
                });

                // Apply updates - if status is COMPLETED, remove from list; otherwise update
                if (updates.length > 0) {
                    const updateMap = new Map(updates.map(u => [u.id, u]));
                    const completedIds = new Set(
                        updates.filter(u => u.status === "COMPLETED").map(u => u.id)
                    );

                    // Remove completed chores
                    next = next.filter((c) => !completedIds.has(c.id));

                    // Update remaining chores
                    next = next.map((c) => {
                        const update = updateMap.get(c.id);
                        if (update && update.status === "PENDING") {
                            return { ...update, createdAt: c.createdAt };
                        }
                        return c;
                    });
                }

                // Apply deletes
                if (deletes.length > 0) {
                    const deleteSet = new Set(deletes);
                    next = next.filter((c) => !deleteSet.has(c.id));
                }

                return next;
            });

            // Clear optimistic updates for updated items
            if (updates.length > 0) {
                setOptimisticUpdates((prev) => {
                    const next = new Map(prev);
                    updates.forEach((u) => next.delete(u.id));
                    return next;
                });
            }

            // Clear pending deletes
            if (deletes.length > 0) {
                setPendingDeletes((prev) => {
                    const next = new Set(prev);
                    deletes.forEach((id) => next.delete(id));
                    return next;
                });
            }
        }
    }, []);

    // Real-time Subscription with Debouncing
    useEffect(() => {
        const channel = supabase
            .channel("chore-updates")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "Chore",
                    filter: `householdId=eq.${householdId}`,
                },
                (payload) => {
                    // Queue the update instead of immediate state change
                    if (payload.eventType === "INSERT") {
                        const newChore = payload.new as Chore;
                        newChore.createdAt = new Date(newChore.createdAt);
                        newChore.updatedAt = new Date(newChore.updatedAt);
                        if (newChore.dueDate) newChore.dueDate = new Date(newChore.dueDate);
                        insertQueueRef.current.set(newChore.id, newChore);
                    } else if (payload.eventType === "UPDATE") {
                        const updatedChore = payload.new as Chore;
                        updatedChore.updatedAt = new Date(updatedChore.updatedAt);
                        if (updatedChore.dueDate) updatedChore.dueDate = new Date(updatedChore.dueDate);
                        updateQueueRef.current.set(updatedChore.id, updatedChore);
                    } else if (payload.eventType === "DELETE") {
                        const deletedId = payload.old.id;
                        deleteQueueRef.current.add(deletedId);
                    }

                    // Debounce: reset timer and flush after delay
                    if (debounceTimerRef.current) {
                        clearTimeout(debounceTimerRef.current);
                    }
                    debounceTimerRef.current = setTimeout(flushUpdateQueue, DEBOUNCE_MS);
                }
            )
            .subscribe();

        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
            supabase.removeChannel(channel);
        };
    }, [householdId, flushUpdateQueue]);

    // Derived State Calculation
    const { myChores, availableChores, householdChores } = React.useMemo(() => {
        // 1. Combine all known chores
        let allChores = [...(serverChores || [])];

        // 2. Identify Server Chores via Correlation ID and preserve optimistic createdAt
        const serverCorrelationIds = new Set<string>();
        const optimisticCreatedAtMap = new Map<string, Date>();

        // Build a map of optimistic chore tempId -> createdAt
        optimisticAdds.forEach(opt => {
            optimisticCreatedAtMap.set(opt.id, opt.createdAt);
        });

        // Clean up server chores (strip correlation step), track IDs, and preserve createdAt
        allChores = allChores.map(chore => {
            if (Array.isArray(chore.steps)) {
                const correlationStep = chore.steps.find((s: any) => s.title === "__CORRELATION__");
                if (correlationStep && correlationStep.id && correlationStep.id.startsWith("cid-")) {
                    const tempId = correlationStep.id.replace("cid-", "");
                    serverCorrelationIds.add(tempId);

                    // Preserve the optimistic createdAt to keep position stable
                    const optimisticCreatedAt = optimisticCreatedAtMap.get(tempId);

                    // Return chore without the correlation step, with preserved createdAt
                    return {
                        ...chore,
                        createdAt: optimisticCreatedAt || chore.createdAt,
                        steps: chore.steps.filter((s: any) => s.title !== "__CORRELATION__")
                    };
                }
            }
            return chore;
        });

        // 3. Add Optimistic Adds (deduplicated by Correlation ID and Heuristic)
        const serverIds = new Set(allChores.map(c => c.id));
        const uniqueAdds = optimisticAdds.filter(optimistic => {
            // 1. Check ID match (exact)
            if (serverIds.has(optimistic.id)) return false;

            // 2. Check Correlation ID match (Robust)
            if (serverCorrelationIds.has(optimistic.id)) return false;

            // 3. Check Heuristic match (Fallback for older chores or other sources)
            const match = allChores.find(server => {
                const sameTitle = server.title === optimistic.title;
                const timeDiff = Math.abs(new Date(server.createdAt).getTime() - new Date(optimistic.createdAt).getTime());
                return sameTitle && timeDiff < 60000; // 1 minute window
            });

            return !match;
        });
        allChores = [...allChores, ...uniqueAdds];

        // 4. Apply Optimistic Updates
        allChores = allChores.map(chore => {
            if (optimisticUpdates.has(chore.id)) {
                return { ...chore, ...optimisticUpdates.get(chore.id) };
            }
            return chore;
        });

        // 5. Filter Pending Deletes
        allChores = allChores.filter(chore => !pendingDeletes.has(chore.id));

        // 6. Hydrate assignedTo if missing
        allChores = allChores.map(chore => {
            if (chore.assignedToId && !chore.assignedTo && members.length > 0) {
                const member = members.find(m => m.userId === chore.assignedToId);
                if (member && member.user) {
                    return {
                        ...chore,
                        assignedTo: {
                            name: member.user.name,
                            image: member.user.image,
                        }
                    };
                }
            }
            return chore;
        });

        // 7. Split lists
        const my = allChores.filter(c => c.assignedToId === userId && c.status === "PENDING");
        const available = allChores.filter(c => c.assignedToId === null && c.status === "PENDING");
        const household = allChores.filter(c => c.assignedToId !== null && c.assignedToId !== userId && c.status === "PENDING");

        const sortByCreated = (a: Chore, b: Chore) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

        return {
            myChores: my.sort(sortByCreated),
            availableChores: available.sort(sortByCreated),
            householdChores: household.sort(sortByCreated),
        };
    }, [serverChores, optimisticAdds, optimisticUpdates, pendingDeletes, userId, members]);


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
        // Just mark as completed - let real-time handle the next occurrence
        // This ensures correct assignment from server's rotation strategy
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

        const newSteps = chore.steps.map(step =>
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
                members,
                userRole,
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
