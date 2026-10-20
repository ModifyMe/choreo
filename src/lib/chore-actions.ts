export type ChoreAction = "CLAIM" | "COMPLETE";

export async function persistChoreAction(choreId: string, action: ChoreAction, proofImage?: string) {
    const response = await fetch(`/api/chores/${encodeURIComponent(choreId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, proofImage }),
    });
    if (!response.ok) {
        throw new Error(await response.text() || "Failed to update chore");
    }
}

// Keep newer in-flight changes, but retire overlays confirmed by a fresh server snapshot.
export function reconcileChoreUpdates<T extends { id: string; status: string }>(
    updates: Map<string, Partial<T>>, chores: T[],
): Map<string, Partial<T>> {
    const byId = new Map(chores.map(chore => [chore.id, chore]));
    const remaining = new Map(updates);
    for (const [id, patch] of updates) {
        const chore = byId.get(id);
        const confirmed = chore
            ? Object.entries(patch).every(([key, value]) => JSON.stringify(chore[key as keyof T]) === JSON.stringify(value))
            : patch.status === "COMPLETED";
        if (confirmed) remaining.delete(id);
    }
    return remaining;
}

// Subtask ticks as a comparable string, independent of JSON key order.
export function stepState(steps?: { id: string; completed: boolean }[] | null) {
    return (steps || []).map(step => `${step.id}:${step.completed ? 1 : 0}`).join(",");
}

// A realtime echo replaces local overlays, except subtask ticks the echo does not
// contain yet: those are saved one request at a time and are still on their way.
export function retireEchoedUpdates<T extends { id: string; steps?: { id: string; completed: boolean }[] | null }>(
    updates: Map<string, Partial<T>>, echoes: T[],
): Map<string, Partial<T>> {
    const remaining = new Map(updates);
    for (const echo of echoes) {
        const pending = remaining.get(echo.id)?.steps;
        if (pending && stepState(pending) !== stepState(echo.steps)) continue;
        remaining.delete(echo.id);
    }
    return remaining;
}
