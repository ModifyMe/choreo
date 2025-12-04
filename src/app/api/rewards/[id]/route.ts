import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const { id } = await params;
        const body = await req.json();
        const { action } = body;

        if (action !== "REDEEM") {
            return new NextResponse("Invalid action", { status: 400 });
        }

        const reward = await prisma.reward.findUnique({
            where: { id },
            include: { household: true },
        });

        if (!reward) {
            return new NextResponse("Reward not found", { status: 404 });
        }

        // Verify membership and balance
        const membership = await prisma.membership.findUnique({
            where: {
                userId_householdId: {
                    userId: session.user.id,
                    householdId: reward.householdId,
                },
            },
        });

        if (!membership) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        if (membership.balance < reward.cost) {
            return new NextResponse("Insufficient funds", { status: 400 });
        }

        if (reward.stock !== null && reward.stock <= 0) {
            return new NextResponse("Out of stock", { status: 400 });
        }

        // Transaction: Deduct balance, (optional) decrement stock
        await prisma.$transaction(async (tx) => {
            await tx.membership.update({
                where: { id: membership.id },
                data: {
                    balance: { decrement: reward.cost },
                },
            });

            if (reward.stock !== null) {
                await tx.reward.update({
                    where: { id },
                    data: { stock: { decrement: 1 } },
                });
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[REWARD_REDEEM]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const { id } = await params;
        const reward = await prisma.reward.findUnique({
            where: { id },
        });

        if (!reward) {
            return new NextResponse("Reward not found", { status: 404 });
        }

        // Verify admin
        const membership = await prisma.membership.findUnique({
            where: {
                userId_householdId: {
                    userId: session.user.id,
                    householdId: reward.householdId,
                },
            },
        });

        if (!membership || membership.role !== "ADMIN") {
            return new NextResponse("Forbidden", { status: 403 });
        }

        await prisma.reward.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[REWARD_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
