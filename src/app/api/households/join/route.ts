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
        const { inviteCode } = body;

        if (!inviteCode) {
            return new NextResponse("Invite code is required", { status: 400 });
        }

        const household = await prisma.household.findUnique({
            where: {
                inviteCode: inviteCode.toUpperCase(),
            },
        });

        if (!household) {
            return new NextResponse("Invalid invite code", { status: 404 });
        }

        // Check if already a member
        const existingMembership = await prisma.membership.findUnique({
            where: {
                userId_householdId: {
                    userId: session.user.id,
                    householdId: household.id,
                },
            },
        });

        if (existingMembership) {
            console.log(`[HOUSEHOLD_JOIN] User ${session.user.id} is already a member of ${household.id}. Membership:`, existingMembership);
            return new NextResponse(`Already a member (Role: ${existingMembership.role})`, { status: 400 });
        }

        await prisma.membership.create({
            data: {
                userId: session.user.id,
                householdId: household.id,
                role: "MEMBER",
            },
        });

        return NextResponse.json(household);
    } catch (error) {
        console.error("[HOUSEHOLD_JOIN]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
