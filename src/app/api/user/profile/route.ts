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
        const { name, image } = body;

        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (image !== undefined) updateData.image = image;

        const updatedUser = await prisma.user.update({
            where: { email: session.user.email },
            data: updateData,
        });

        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error("[PROFILE_UPDATE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
