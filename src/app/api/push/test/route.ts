import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { sendPushNotification } from "@/lib/push";

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

        // Verify user is member of household
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

        // Get all members
        const members = await prisma.membership.findMany({
            where: { householdId },
            select: { userId: true },
        });

        // Send notifications
        const results = await Promise.all(members.map(member =>
            sendPushNotification(
                member.userId,
                "Test Notification 🔔",
                "This is a test push notification from Choreo! If you see this, it works.",
                "/"
            )
        ));

        const stats = results.reduce((acc, curr) => ({
            success: acc.success + (curr?.success || 0),
            failure: acc.failure + (curr?.failure || 0),
            total: acc.total + (curr?.total || 0)
        }), { success: 0, failure: 0, total: 0 });

        return NextResponse.json({
            success: true,
            ...stats,
            memberCount: members.length
        });
    } catch (error) {
        console.error("Error sending test push:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
