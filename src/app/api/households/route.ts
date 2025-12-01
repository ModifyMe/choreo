import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { nanoid } from "nanoid";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const body = await req.json();
        const { name } = body;

        if (!name) {
            return new NextResponse("Name is required", { status: 400 });
        }

        // Generate a short 6-character invite code
        const inviteCode = nanoid(6).toUpperCase();

        const household = await prisma.household.create({
            data: {
                name,
                inviteCode,
                members: {
                    create: {
                        userId: session.user.id,
                        role: "ADMIN",
                    },
                },
            },
        });

        return NextResponse.json(household);
    } catch (error) {
        console.error("[HOUSEHOLD_CREATE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
