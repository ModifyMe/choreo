import type { Prisma, PrismaClient } from "@prisma/client";

type Step = { id: string; title: string; completed: boolean };

// Sets one subtask on a chore. Steps live in one JSON column, so two quick taps
// on different steps used to read the same array and the later write dropped the
// earlier tick. Locking the row makes concurrent updates apply one after another.
// `completed` is the state the user wants; without it the step is flipped.
export async function setChoreStep(db: PrismaClient, choreId: string, stepId: string, completed?: boolean) {
    return db.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM "Chore" WHERE id = ${choreId} FOR UPDATE`;
        const chore = await tx.chore.findUnique({ where: { id: choreId }, select: { steps: true } });
        const steps = ((chore?.steps as Step[] | null) || []).map(step =>
            step.id === stepId ? { ...step, completed: typeof completed === "boolean" ? completed : !step.completed } : step
        );
        return tx.chore.update({
            where: { id: choreId },
            data: { steps: steps as unknown as Prisma.InputJsonValue },
        });
    });
}
