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
        const body = await req.json();
        const { title, description, points, householdId, dueDate, recurrence, assignedToId } = body;

        if (!title || !points || !householdId) {
            return new NextResponse("Missing required fields", { status: 400 });
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

        const chore = await prisma.chore.create({
            data: {
                title,
                description,
                points: parseInt(points),
                householdId,
                assignedToId: assignedToId || null,
                status: "PENDING",
                dueDate: dueDate ? new Date(dueDate) : null,
                recurrence: recurrence === "NONE" ? null : recurrence,
                recurrenceData: body.recurrenceData ? JSON.stringify(body.recurrenceData) : null, // Save custom recurrence data
                reminderTime: body.reminderTime || null,
                priority: body.priority || "MEDIUM",
                // Strip __CORRELATION__ steps - they're only for client-side optimistic update matching
                steps: body.steps ? body.steps.filter((s: any) => s.title !== "__CORRELATION__") : null,
                activityLogs: {
                    create: {
                        userId: session.user.id,
                        householdId,
                        action: "CREATED",
                    },
                },
            },
        });

        // Send notifications for HIGH priority chores
        if (chore.priority === "HIGH") {
            // Fetch other household members
            const members = await prisma.membership.findMany({
                where: {
                    householdId,
                    userId: {
                        not: session.user.id, // Don't notify the creator
                    },
                },
                select: {
                    userId: true,
                },
            });

            // Send notifications in parallel
            await Promise.all(
                members.map((member) =>
                    sendPushNotification(
                        member.userId,
                        "🔥 High Priority Chore!",
                        `${session.user.name || "Someone"} added: ${chore.title}`,
                        "/dashboard"
                    )
                )
            );
        }

        return NextResponse.json(chore);
    } catch (error) {
        console.error("[CHORE_CREATE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
