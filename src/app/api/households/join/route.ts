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

        if (typeof inviteCode !== "string" || !/^[A-Z0-9_-]{6}$/.test(inviteCode.trim().toUpperCase())) {
            return new NextResponse("A valid six-character invite code is required", { status: 400 });
        }

        const household = await prisma.household.findUnique({
            where: {
                inviteCode: inviteCode.trim().toUpperCase(),
            },
        });

        if (!household) {
            return new NextResponse("Invalid invite code", { status: 404 });
        }

        // Reopening an invitation preserves the member's existing role.
        await prisma.membership.upsert({
            where: {
                userId_householdId: {
                    userId: session.user.id,
                    householdId: household.id,
                },
            },
            update: {},
            create: {
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
