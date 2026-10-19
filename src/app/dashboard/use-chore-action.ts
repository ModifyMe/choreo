"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { persistChoreAction, type ChoreAction } from "@/lib/chore-actions";
import { useChores } from "./chore-context";

export function useChoreAction(userId: string) {
    const router = useRouter();
    const { updateChore, clearChoreUpdate } = useChores();

    return useCallback(async (choreId: string, action: ChoreAction, proofImage?: string) => {
        updateChore(choreId, action === "CLAIM" ? { assignedToId: userId } : { status: "COMPLETED" });
        try {
            await persistChoreAction(choreId, action, proofImage);
        } catch (error) {
            clearChoreUpdate(choreId);
            throw error;
        } finally {
            // XP, levels, gold, streaks, achievements, leaderboard and recurring
            // chores come from the server. Realtime delivery is optional here.
            router.refresh();
        }
    }, [router, updateChore, clearChoreUpdate, userId]);
}
