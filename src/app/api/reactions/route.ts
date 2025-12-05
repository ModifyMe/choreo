import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED_EMOJIS = ["👏", "🎉", "❤️", "🔥", "😂"];

// POST - Add or toggle reaction
export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { activityLogId, emoji } = await request.json();

    if (!activityLogId || !emoji) {
        return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    if (!ALLOWED_EMOJIS.includes(emoji)) {
        return NextResponse.json({ error: "Invalid emoji" }, { status: 400 });
    }

    // Check if activity exists and user has access (same household)
    const activity = await prisma.activityLog.findUnique({
        where: { id: activityLogId },
        include: { household: { include: { members: true } } },
    });

    if (!activity) {
        return NextResponse.json({ error: "Activity not found" }, { status: 404 });
    }

    const isMember = activity.household.members.some(
        (m) => m.userId === session.user.id
    );

    if (!isMember) {
        return NextResponse.json({ error: "Not a household member" }, { status: 403 });
    }

    // Check existing reaction
    const existing = await prisma.activityReaction.findUnique({
        where: {
            activityLogId_userId: {
                activityLogId,
                userId: session.user.id,
            },
        },
    });

    if (existing) {
        if (existing.emoji === emoji) {
            // Same emoji - remove reaction (toggle off)
            await prisma.activityReaction.delete({
                where: { id: existing.id },
            });
            return NextResponse.json({ action: "removed" });
        } else {
            // Different emoji - update reaction
            await prisma.activityReaction.update({
                where: { id: existing.id },
                data: { emoji },
            });
            return NextResponse.json({ action: "updated", emoji });
        }
    }

    // Create new reaction
    await prisma.activityReaction.create({
        data: {
            activityLogId,
            userId: session.user.id,
            emoji,
        },
    });

    return NextResponse.json({ action: "added", emoji });
}
