import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import webpush from "web-push";

// Configure web-push
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        "mailto:choreo@example.com",
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
}

// GET /api/swaps/[id] - Get a specific swap offer
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const { id } = await params;

        const swapOffer = await prisma.swapOffer.findUnique({
            where: { id },
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
                counterOffers: {
                    select: { id: true, wantedDescription: true, createdBy: { select: { name: true } } },
                },
            },
        });

        if (!swapOffer) {
            return new NextResponse("Swap offer not found", { status: 404 });
        }

        return NextResponse.json(swapOffer);
    } catch (error) {
        console.error("[SWAP_GET]", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

// PATCH /api/swaps/[id] - Accept a swap offer or cancel
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const { id } = await params;
        const body = await req.json();
        const { action } = body;

        const swapOffer = await prisma.swapOffer.findUnique({
            where: { id },
            include: {
                offeredChore: true,
                wantedChore: true,
                createdBy: {
                    include: {
                        pushSubscriptions: true,
                    },
                },
            },
        });

        if (!swapOffer) {
            return new NextResponse("Swap offer not found", { status: 404 });
        }

        if (swapOffer.status !== "ACTIVE") {
            return new NextResponse("Swap offer is no longer active", { status: 400 });
        }

        // Verify membership
        const membership = await prisma.membership.findUnique({
            where: {
                userId_householdId: {
                    userId: session.user.id,
                    householdId: swapOffer.householdId,
                },
            },
        });

        if (!membership) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        if (action === "ACCEPT") {
            // Cannot accept your own offer
            if (swapOffer.createdById === session.user.id) {
                return new NextResponse("Cannot accept your own swap offer", { status: 400 });
            }

            // Get accepter's chore that matches what was wanted (if specified)
            let accepterChoreId: string | null = null;

            if (swapOffer.wantedChoreId) {
                // Specific chore was requested - verify accepter owns it
                const wantedChore = await prisma.chore.findUnique({
                    where: { id: swapOffer.wantedChoreId },
                });

                if (!wantedChore || wantedChore.assignedToId !== session.user.id) {
                    return new NextResponse("You don't own the requested chore", { status: 400 });
                }
                accepterChoreId = swapOffer.wantedChoreId;
            }

            // Perform the swap
            await prisma.$transaction(async (tx) => {
                // Mark swap as accepted
                await tx.swapOffer.update({
                    where: { id },
                    data: {
                        status: "ACCEPTED",
                        acceptedById: session.user.id,
                        acceptedAt: new Date(),
                    },
                });

                // Swap the offered chore to the accepter
                await tx.chore.update({
                    where: { id: swapOffer.offeredChoreId },
                    data: { assignedToId: session.user.id },
                });

                // If there's a specific wanted chore, swap it to the creator
                if (accepterChoreId) {
                    await tx.chore.update({
                        where: { id: accepterChoreId },
                        data: { assignedToId: swapOffer.createdById },
                    });
                }

                // Log activity
                await tx.activityLog.create({
                    data: {
                        householdId: swapOffer.householdId,
                        userId: session.user.id,
                        action: "SWAP_ACCEPTED",
                        choreId: swapOffer.offeredChoreId,
                        metadata: {
                            swapOfferId: swapOffer.id,
                            offeredChoreTitle: swapOffer.offeredChore.title,
                            accepterChoreId,
                            creatorId: swapOffer.createdById,
                            creatorName: swapOffer.createdBy.name,
                        },
                    },
                });
            });

            // Send push notification to the creator
            const userName = session.user.name || "Someone";
            const choreTitle = swapOffer.offeredChore.title;

            for (const sub of swapOffer.createdBy.pushSubscriptions) {
                try {
                    await webpush.sendNotification(
                        {
                            endpoint: sub.endpoint,
                            keys: { p256dh: sub.p256dh, auth: sub.auth },
                        },
                        JSON.stringify({
                            title: "Swap Accepted! 🔄",
                            body: `${userName} accepted your swap for "${choreTitle}"`,
                            icon: "/icon-192x192.png",
                            data: { url: "/dashboard" },
                        })
                    );
                } catch (err) {
                    console.error("Push notification failed:", err);
                }
            }

            return NextResponse.json({ success: true, message: "Swap accepted!" });
        }

        if (action === "CANCEL") {
            // Only creator can cancel
            if (swapOffer.createdById !== session.user.id) {
                return new NextResponse("Only the creator can cancel", { status: 403 });
            }

            await prisma.swapOffer.update({
                where: { id },
                data: { status: "CANCELLED" },
            });

            return NextResponse.json({ success: true, message: "Swap cancelled" });
        }

        return new NextResponse("Invalid action", { status: 400 });
    } catch (error) {
        console.error("[SWAP_PATCH]", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

// DELETE /api/swaps/[id] - Delete swap offer (alias for cancel)
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const { id } = await params;

        const swapOffer = await prisma.swapOffer.findUnique({
            where: { id },
        });

        if (!swapOffer) {
            return new NextResponse("Swap offer not found", { status: 404 });
        }

        if (swapOffer.createdById !== session.user.id) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        await prisma.swapOffer.update({
            where: { id },
            data: { status: "CANCELLED" },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[SWAP_DELETE]", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
