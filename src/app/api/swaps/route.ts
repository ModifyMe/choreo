import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { addHours } from "date-fns";

// GET /api/swaps - List active swap offers for household
export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const householdId = searchParams.get("householdId");

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

        const now = new Date();

        // Mark expired offers
        await prisma.swapOffer.updateMany({
            where: {
                householdId,
                status: "ACTIVE",
                expiresAt: { lt: now },
            },
            data: { status: "EXPIRED" },
        });

        // Fetch active swap offers
        const swapOffers = await prisma.swapOffer.findMany({
            where: {
                householdId,
                status: "ACTIVE",
            },
            include: {
                offeredChore: {
                    select: {
                        id: true,
                        title: true,
                        points: true,
                        dueDate: true,
                        priority: true,
                    },
                },
                wantedChore: {
                    select: {
                        id: true,
                        title: true,
                        points: true,
                        assignedTo: {
                            select: { name: true, image: true },
                        },
                    },
                },
                createdBy: {
                    select: { id: true, name: true, image: true },
                },
                counterTo: {
                    select: { id: true, wantedDescription: true },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(swapOffers);
    } catch (error) {
        console.error("[SWAPS_GET]", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

// POST /api/swaps - Create a new swap offer
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const body = await req.json();
        const { offeredChoreId, wantedDescription, wantedChoreId, counterToId } = body;

        if (!offeredChoreId || !wantedDescription) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        // Verify the chore belongs to the user
        const chore = await prisma.chore.findUnique({
            where: { id: offeredChoreId },
            include: { household: true },
        });

        if (!chore) {
            return new NextResponse("Chore not found", { status: 404 });
        }

        if (chore.assignedToId !== session.user.id) {
            return new NextResponse("You can only offer your own chores", { status: 403 });
        }

        // Check swap count (max 2 times per chore)
        if (chore.swapOfferCount >= 2) {
            return new NextResponse("This chore has already been offered twice", { status: 400 });
        }

        // Verify membership
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

        // If wantedChoreId provided, verify it exists and belongs to someone else
        if (wantedChoreId) {
            const wantedChore = await prisma.chore.findUnique({
                where: { id: wantedChoreId },
            });

            if (!wantedChore || wantedChore.householdId !== chore.householdId) {
                return new NextResponse("Wanted chore not found", { status: 404 });
            }

            if (wantedChore.assignedToId === session.user.id) {
                return new NextResponse("Cannot request your own chore", { status: 400 });
            }
        }

        // Create swap offer (expires in 24 hours)
        const expiresAt = addHours(new Date(), 24);

        const [swapOffer] = await prisma.$transaction([
            prisma.swapOffer.create({
                data: {
                    offeredChoreId,
                    wantedDescription,
                    wantedChoreId: wantedChoreId || null,
                    createdById: session.user.id,
                    householdId: chore.householdId,
                    expiresAt,
                    counterToId: counterToId || null,
                },
                include: {
                    offeredChore: {
                        select: { id: true, title: true, points: true },
                    },
                    createdBy: {
                        select: { id: true, name: true, image: true },
                    },
                },
            }),
            // Increment swap offer count
            prisma.chore.update({
                where: { id: offeredChoreId },
                data: { swapOfferCount: { increment: 1 } },
            }),
            // If this is a counter-offer, mark original as COUNTERED
            ...(counterToId
                ? [
                    prisma.swapOffer.update({
                        where: { id: counterToId },
                        data: { status: "COUNTERED" },
                    }),
                ]
                : []),
        ]);

        return NextResponse.json(swapOffer);
    } catch (error) {
        console.error("[SWAPS_POST]", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
