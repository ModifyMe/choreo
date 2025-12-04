import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const { id } = await params;
        const body = await req.json();
        const { mode, assignmentStrategy } = body;

        const dataToUpdate: any = {};

        if (mode) {
            if (mode !== "STANDARD" && mode !== "ECONOMY") {
                return new NextResponse("Invalid mode", { status: 400 });
            }
            dataToUpdate.mode = mode;
        }

        if (assignmentStrategy) {
            const validStrategies = ["LOAD_BALANCING", "STRICT_ROTATION", "RANDOM", "NONE"];
            if (!validStrategies.includes(assignmentStrategy)) {
                return new NextResponse("Invalid strategy", { status: 400 });
            }
            dataToUpdate.assignmentStrategy = assignmentStrategy;
        }

        // Verify admin
        const membership = await prisma.membership.findUnique({
            where: {
                userId_householdId: {
                    userId: session.user.id,
                    householdId: id,
                },
            },
        });

        if (!membership || membership.role !== "ADMIN") {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const household = await prisma.household.update({
            where: { id },
            data: dataToUpdate,
        });

        return NextResponse.json(household);
    } catch (error) {
        console.error("[HOUSEHOLD_UPDATE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
