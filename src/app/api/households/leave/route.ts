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
        const { householdId } = await req.json();

        if (!householdId) {
            return new NextResponse("Household ID required", { status: 400 });
        }

        // Find the membership
        const membership = await prisma.membership.findUnique({
            where: {
                userId_householdId: {
                    userId: session.user.id,
                    householdId: householdId,
                },
            },
        });

        if (!membership) {
            return new NextResponse("Membership not found", { status: 404 });
        }

        // Delete the membership
        await prisma.membership.delete({
            where: {
                id: membership.id,
            },
        });

        // Optional: Check if household is empty and delete it? 
        // For now, let's leave it.

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[LEAVE_HOUSEHOLD]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
