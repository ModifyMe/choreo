import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });

    const { searchParams } = new URL(req.url);
    const householdId = searchParams.get("householdId");

    if (!householdId) return new NextResponse("Household ID required", { status: 400 });

    const items = await prisma.shoppingItem.findMany({
        where: { householdId },
        orderBy: { createdAt: "desc" },
        include: { addedBy: { select: { name: true, image: true } } }
    });

    return NextResponse.json(items);
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return new NextResponse("User not found", { status: 404 });

    const body = await req.json();
    const { householdId, name } = body;

    if (!householdId || !name) return new NextResponse("Missing fields", { status: 400 });

    const item = await prisma.shoppingItem.create({
        data: {
            householdId,
            name,
            addedById: user.id,
        },
        include: { addedBy: { select: { name: true, image: true } } }
    });

    return NextResponse.json(item);
}
