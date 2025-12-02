import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { sendPushNotification } from "@/lib/push";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const { id } = await params;

        const chore = await prisma.chore.findUnique({
            where: { id },
            include: {
                household: true,
                assignedTo: true
            },
        });

        if (!chore) {
            return new NextResponse("Chore not found", { status: 404 });
        }

        if (!chore.assignedToId) {
            return new NextResponse("Chore is unassigned", { status: 400 });
        }

        // Verify sender membership
        const membership = await prisma.membership.findUnique({
            where: {
                userId_householdId: {
                    userId: session.user.id,
                    householdId: chore.householdId,
                },
            },
        });

        if (!membership) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        // Don't nudge yourself (unless testing, but generally weird)
        if (chore.assignedToId === session.user.id) {
            return new NextResponse("You can't nudge yourself!", { status: 400 });
        }

        // Send Notification
        const senderName = session.user.name || "A housemate";
        await sendPushNotification(
            chore.assignedToId,
            "👉 Nudge!",
            `${senderName} is reminding you to do: ${chore.title}`,
            "/dashboard"
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[NUDGE_ERROR]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
