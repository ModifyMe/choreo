import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(
    req: Request,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });

    const { checked } = await req.json();

    const item = await prisma.shoppingItem.update({
        where: { id: params.id },
        data: { checked },
    });

    return NextResponse.json(item);
}

export async function DELETE(
    req: Request,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });

    await prisma.shoppingItem.delete({
        where: { id: params.id },
    });

    return NextResponse.json({ success: true });
}
