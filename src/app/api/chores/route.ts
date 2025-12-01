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
        const { title, description, points, householdId, dueDate, recurrence } = body;

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
                status: "PENDING",
                dueDate: dueDate ? new Date(dueDate) : null,
                recurrence: recurrence === "NONE" ? null : recurrence,
                activityLogs: {
                    create: {
                        userId: session.user.id,
                        action: "CREATED",
                    },
                },
            },
        });

        return NextResponse.json(chore);
    } catch (error) {
        console.error("[CHORE_CREATE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
