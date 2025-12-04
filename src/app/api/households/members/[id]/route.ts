import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const { id: memberIdToRemove } = await params;
        const { householdId } = await req.json();

        if (!householdId) {
            return new NextResponse("Household ID required", { status: 400 });
        }

        // Verify requester is ADMIN of the household
        const requesterMembership = await prisma.membership.findUnique({
            where: {
                userId_householdId: {
                    userId: session.user.id,
                    householdId: householdId,
                },
            },
        });

        if (!requesterMembership || requesterMembership.role !== "ADMIN") {
            return new NextResponse("Forbidden", { status: 403 });
        }

        // Verify the member to remove belongs to the same household
        const memberToRemove = await prisma.membership.findUnique({
            where: { id: memberIdToRemove },
        });

        if (!memberToRemove || memberToRemove.householdId !== householdId) {
            return new NextResponse("Member not found in this household", { status: 404 });
        }

        // Prevent removing yourself (use leave endpoint instead)
        if (memberToRemove.userId === session.user.id) {
            return new NextResponse("Cannot remove yourself", { status: 400 });
        }

        // Delete the membership
        await prisma.membership.delete({
            where: { id: memberIdToRemove },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[REMOVE_MEMBER]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
