import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const body = await req.json();
        const { householdId, isAway } = body;

        if (!householdId || typeof isAway !== "boolean") {
            return new NextResponse("Invalid request", { status: 400 });
        }

        // Verify membership
        const membership = await prisma.membership.findUnique({
            where: {
                userId_householdId: {
                    userId: session.user.id,
                    householdId: householdId,
                },
            },
        });

        if (!membership) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const updatedMembership = await prisma.membership.update({
            where: {
                userId_householdId: {
                    userId: session.user.id,
                    householdId: householdId,
                },
            },
            data: {
                isAway: isAway,
            },
        });

        return NextResponse.json(updatedMembership);
    } catch (error) {
        console.error("[MEMBERSHIP_UPDATE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
