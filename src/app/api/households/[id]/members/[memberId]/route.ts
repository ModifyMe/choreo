import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// Update member role
export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string; memberId: string }> }
) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const { id: householdId, memberId } = await params;
        const body = await req.json();
        const { role } = body;

        if (!role || (role !== "ADMIN" && role !== "MEMBER")) {
            return new NextResponse("Invalid role", { status: 400 });
        }

        // Verify requester is admin of this household
        const requesterMembership = await prisma.membership.findUnique({
            where: {
                userId_householdId: {
                    userId: session.user.id,
                    householdId,
                },
            },
        });

        if (!requesterMembership || requesterMembership.role !== "ADMIN") {
            return new NextResponse("Forbidden - Admin required", { status: 403 });
        }

        // Find the target membership
        const targetMembership = await prisma.membership.findUnique({
            where: { id: memberId },
            include: { user: true },
        });

        if (!targetMembership || targetMembership.householdId !== householdId) {
            return new NextResponse("Member not found", { status: 404 });
        }

        // Prevent demoting the last admin
        if (role === "MEMBER" && targetMembership.role === "ADMIN") {
            const adminCount = await prisma.membership.count({
                where: {
                    householdId,
                    role: "ADMIN",
                },
            });

            if (adminCount <= 1) {
                return new NextResponse("Cannot demote the last admin", { status: 400 });
            }
        }

        // Update the role
        const updatedMembership = await prisma.membership.update({
            where: { id: memberId },
            data: { role },
            include: { user: true },
        });

        return NextResponse.json(updatedMembership);
    } catch (error) {
        console.error("[MEMBER_ROLE_UPDATE]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}
