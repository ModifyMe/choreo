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
