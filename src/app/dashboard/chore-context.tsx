"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

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
}

const ChoreContext = createContext<ChoreContextType | undefined>(undefined);

export function ChoreProvider({
    children,
    initialMyChores,
    initialAvailableChores,
}: {
    children: React.ReactNode;
    initialMyChores: Chore[];
    initialAvailableChores: Chore[];
}) {
    const [myChores, setMyChores] = useState<Chore[]>(initialMyChores);
    const [availableChores, setAvailableChores] = useState<Chore[]>(initialAvailableChores);
    const router = useRouter();

    // Sync with server data when it updates (after router.refresh)
    useEffect(() => {
        setMyChores(initialMyChores);
    }, [initialMyChores]);

    useEffect(() => {
        setAvailableChores(initialAvailableChores);
    }, [initialAvailableChores]);

    const addChore = useCallback((chore: Chore) => {
        if (chore.assignedToId) {
            setMyChores((prev) => [chore, ...prev]);
        } else {
            setAvailableChores((prev) => [chore, ...prev]);
        }
    }, []);

    const updateChore = useCallback((id: string, updates: Partial<Chore>) => {
        setMyChores((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
        setAvailableChores((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
    }, []);

    const deleteChore = useCallback((id: string) => {
        setMyChores((prev) => prev.filter((c) => c.id !== id));
        setAvailableChores((prev) => prev.filter((c) => c.id !== id));
    }, []);

    const moveChoreToMy = useCallback((id: string, userId: string) => {
        setAvailableChores((prev) => {
            const chore = prev.find((c) => c.id === id);
            if (chore) {
                setMyChores((myPrev) => [{ ...chore, assignedToId: userId }, ...myPrev]);
                return prev.filter((c) => c.id !== id);
            }
            return prev;
        });
    }, []);

    const completeChore = useCallback((id: string) => {
        // Remove from list as we usually filter by PENDING
        setMyChores((prev) => prev.filter((c) => c.id !== id));
        setAvailableChores((prev) => prev.filter((c) => c.id !== id));
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
