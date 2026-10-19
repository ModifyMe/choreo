import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const origin = req.headers.get("origin");
    if (origin && origin !== new URL(req.url).origin) {
        return new NextResponse("Forbidden", { status: 403 });
    }

    const body = await req.json().catch(() => null);
    if (body?.confirmation !== "RESET") {
        return new NextResponse("Type RESET to confirm", { status: 400 });
    }

    const { id: householdId } = await params;
    try {
        const reset = await prisma.$transaction(async (tx) => {
            const membership = await tx.membership.findUnique({
                where: { userId_householdId: { userId: session.user.id, householdId } },
            });
            if (membership?.role !== "ADMIN") return false;

            // Remove dependent records before chores/rewards. Activity reactions
            // are removed by the ActivityLog foreign key's cascading delete.
            await tx.swapOffer.deleteMany({ where: { householdId } });
            await tx.activityLog.deleteMany({ where: { householdId } });
            await tx.chore.deleteMany({ where: { householdId } });
            await tx.reward.deleteMany({ where: { householdId } });
            await tx.shoppingItem.deleteMany({ where: { householdId } });
            await tx.membership.updateMany({
                where: { householdId },
                data: { balance: 0, totalPoints: 0, currentStreak: 0, lastChoreDate: null },
            });
            return true;
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

        if (!reset) return new NextResponse("Only household admins can reset this household", { status: 403 });
        return NextResponse.json({ success: true });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") {
            return new NextResponse("Household changed during reset. Please try again.", { status: 409 });
        }
        console.error("[HOUSEHOLD_RESET]", error);
        return new NextResponse("Failed to reset household. No changes were saved.", { status: 500 });
    }
}
