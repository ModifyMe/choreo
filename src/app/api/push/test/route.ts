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
            return new NextResponse("Missing householdId", { status: 400 });
        }

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

        // Fetch all members of the household (including self for test)
        const members = await prisma.membership.findMany({
            where: {
                householdId,
            },
            select: {
                userId: true,
            },
        });

        let successCount = 0;
        let failureCount = 0;

        await Promise.all(
            members.map(async (member) => {
                const result = await sendPushNotification(
                    member.userId,
                    "🔔 Test Notification",
                    "This is a test push notification from Choreo!",
                    "/dashboard"
                );
                successCount += result.success;
                failureCount += result.failure;
            })
        );

        return NextResponse.json({ success: successCount, failure: failureCount });
    } catch (error) {
        console.error("[PUSH_TEST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
