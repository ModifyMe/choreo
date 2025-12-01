import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const body = await req.json();
        const { name, cost, householdId } = body;

        if (!name || !cost || !householdId) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        // Verify membership and admin role
        const membership = await prisma.membership.findUnique({
            where: {
                userId_householdId: {
                    userId: session.user.id,
                    householdId,
                },
            },
        });

        if (!membership || membership.role !== "ADMIN") {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const reward = await prisma.reward.create({
            data: {
                name,
                cost: parseInt(cost),
                householdId,
            },
        });

        return NextResponse.json(reward);
    } catch (error) {
        console.error("[REWARDS_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(req.url);
    const householdId = searchParams.get("householdId");

    if (!session?.user?.email || !householdId) {
        return new NextResponse("Unauthorized or Missing ID", { status: 401 });
    }

    try {
        // Verify membership
        const membership = await prisma.membership.findUnique({
            where: {
                userId_householdId: {
                    userId: session.user.id,
                    householdId,
                },
            },
        });

        if (!membership) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const rewards = await prisma.reward.findMany({
            where: { householdId },
            orderBy: { cost: "asc" },
        });

        return NextResponse.json(rewards);
    } catch (error) {
        console.error("[REWARDS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
