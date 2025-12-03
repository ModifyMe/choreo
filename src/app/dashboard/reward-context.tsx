"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export interface Reward {
    id: string;
    name: string;
    cost: number;
    stock: number | null;
    householdId: string;
    createdAt: Date;
    updatedAt: Date;
}

interface RewardContextType {
    rewards: Reward[];
    addReward: (reward: Reward) => void;
    deleteReward: (id: string) => void;
    redeemReward: (id: string) => void;
    removeOptimisticReward: (id: string) => void;
}

const RewardContext = createContext<RewardContextType | undefined>(undefined);

export function RewardProvider({
    children,
    initialRewards,
    householdId,
}: {
    children: React.ReactNode;
    initialRewards: Reward[];
    householdId: string;
}) {
    // Server state
    const [serverRewards, setServerRewards] = useState<Reward[]>(initialRewards);

    // Optimistic state
    const [pendingDeletes, setPendingDeletes] = useState<Set<string>>(new Set());
    const [optimisticAdds, setOptimisticAdds] = useState<Reward[]>([]);

    // Sync with server data
    useEffect(() => {
        setServerRewards(initialRewards);
    }, [initialRewards]);

    // Real-time Subscription
    useEffect(() => {
        const channel = supabase
            .channel('realtime-rewards')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'Reward',
                    filter: undefined, // Subscribe to ALL events on the table, filter client-side
                },
                (payload) => {
                    console.log('Real-time reward change received!', payload);

                    // Client-side filtering
                    const record = payload.new || payload.old;

                    // For DELETE, we might not have householdId in payload.old, but it's safe to proceed 
                    // as we only remove by ID if it exists in our local state.
                    // For INSERT/UPDATE, we must check householdId.
                    if (payload.eventType !== 'DELETE' && record && (record as any).householdId !== householdId) {
                        return;
                    }

                    if (payload.eventType === 'INSERT') {
                        const newReward = payload.new as Reward;
                        newReward.createdAt = new Date(newReward.createdAt);
                        newReward.updatedAt = new Date(newReward.updatedAt);
                        setServerRewards((prev) => [...prev, newReward]);
                    } else if (payload.eventType === 'UPDATE') {
                        const updatedReward = payload.new as Reward;
                        updatedReward.createdAt = new Date(updatedReward.createdAt);
                        updatedReward.updatedAt = new Date(updatedReward.updatedAt);

                        setServerRewards((prev) => {
                            const exists = prev.some(r => r.id === updatedReward.id);
                            if (exists) {
                                return prev.map(r => r.id === updatedReward.id ? updatedReward : r);
                            }
                            // If it doesn't exist (e.g. created by someone else), add it
                            return [...prev, updatedReward];
                        });
                    } else if (payload.eventType === 'DELETE') {
                        const deletedId = payload.old.id;
                        setServerRewards((prev) => prev.filter((r) => r.id !== deletedId));
                    }
                }
            )
            .subscribe((status) => {
                console.log(`Real-time reward subscription status: ${status}`);
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
                const inList = serverRewards.some(r => r.id === id);
                // If it's gone from server data, it's confirmed deleted
                if (!inList) {
                    next.delete(id);
                    changed = true;
                }
            }
            return changed ? next : prev;
        });

        // Cleanup Optimistic Adds
        setOptimisticAdds(prev => {
            const next = prev.filter(add => {
                const matchFound = serverRewards.some(serverReward => {
                    // 1. Direct ID match
                    if (serverReward.id === add.id) return true;

                    // 2. Content match (for creates where ID differs)
                    return (
                        serverReward.name === add.name &&
                        serverReward.cost === add.cost
                    );
                });

                // Keep the optimistic add only if NO match is found in server data
                return !matchFound;
            });
            return next.length !== prev.length ? next : prev;
        });
    }, [serverRewards]);

    // Derived State Calculation
    const rewards = React.useMemo(() => {
        // 1. Combine all known rewards
        let allRewards = [...serverRewards];

        // 2. Add Optimistic Adds (deduplicated by ID)
        const serverIds = new Set(allRewards.map(r => r.id));
        const uniqueAdds = optimisticAdds.filter(r => !serverIds.has(r.id));
        allRewards = [...allRewards, ...uniqueAdds];

        // 3. Filter Pending Deletes
        allRewards = allRewards.filter(r => !pendingDeletes.has(r.id));

        // Sort by cost asc
        return allRewards.sort((a, b) => a.cost - b.cost);
    }, [serverRewards, optimisticAdds, pendingDeletes]);


    const addReward = useCallback((reward: Reward) => {
        setOptimisticAdds((prev) => [...prev, reward]);
    }, []);

    const deleteReward = useCallback((id: string) => {
        setPendingDeletes((prev) => {
            const next = new Set(prev);
            next.add(id);
            return next;
        });
    }, []);

    const redeemReward = useCallback((id: string) => {
        // For now, we don't optimistically update stock/balance here because balance is on Membership 
        // and stock is on Reward. We could decrement stock optimistically if we wanted.
        // Let's just rely on the fast server response for redemption for now, 
        // OR we can decrement stock if it's not null.

        setServerRewards(prev => prev.map(r => {
            if (r.id === id && r.stock !== null && r.stock > 0) {
                return { ...r, stock: r.stock - 1 };
            }
            return r;
        }));
    }, []);

    const removeOptimisticReward = useCallback((id: string) => {
        setOptimisticAdds((prev) => prev.filter((r) => r.id !== id));
    }, []);

    return (
        <RewardContext.Provider
            value={{
                rewards,
                addReward,
                deleteReward,
                redeemReward,
                removeOptimisticReward,
            }}
        >
            {children}
        </RewardContext.Provider>
    );
}

export function useRewards() {
    const context = useContext(RewardContext);
    if (context === undefined) {
        throw new Error("useRewards must be used within a RewardProvider");
    }
    return context;
}
