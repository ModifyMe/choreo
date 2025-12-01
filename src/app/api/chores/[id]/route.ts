import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { checkAchievements } from "@/lib/achievements";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const { id } = await params;
        const body = await req.json();
        const { action } = body; // 'COMPLETE' or 'CLAIM'

        const chore = await prisma.chore.findUnique({
            where: { id },
            include: { household: true },
        });

        if (!chore) {
            return new NextResponse("Chore not found", { status: 404 });
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

        if (action === "COMPLETE") {
            if (chore.status === "COMPLETED") {
                return new NextResponse("Already completed", { status: 400 });
            }

            // Transaction to update chore and award points
            const transactionOperations: any[] = [
                prisma.chore.update({
                    where: { id },
                    data: {
                        status: "COMPLETED",
                        activityLogs: {
                            create: {
                                userId: session.user.id,
                                action: "COMPLETED",
                                proofImage: body.proofImage, // Save proof URL
                            },
                        },
                    },
                }),
                prisma.user.update({
                    where: { id: session.user.id },
                    data: {
                        totalPoints: {
                            increment: chore.points,
                        },
                    },
                }),
            ];

            if (chore.household.mode === "ECONOMY") {
                transactionOperations.push(
                    prisma.membership.update({
                        where: {
                            userId_householdId: {
                                userId: session.user.id,
                                householdId: chore.householdId,
                            },
                        },
                        data: {
                            balance: {
                                increment: chore.points,
                            },
                        },
                    })
                );
            }

            const result = await prisma.$transaction(transactionOperations);
            const updatedChore = result[0];

            // Check achievements
            await checkAchievements(session.user.id);

            // Handle Recurrence & Auto-Delegation
            if (chore.recurrence && chore.recurrence !== "NONE") {
                let nextDueDate = new Date();
                if (chore.recurrence === "DAILY") {
                    nextDueDate.setDate(nextDueDate.getDate() + 1);
                } else if (chore.recurrence === "WEEKLY") {
                    nextDueDate.setDate(nextDueDate.getDate() + 7);
                }

                // Find next assignee (Round Robin with Load Balancing)
                const members = await prisma.membership.findMany({
                    where: {
                        householdId: chore.householdId,
                        isAway: false // Exclude members on vacation
                    },
                    include: { user: { select: { totalPoints: true } } },
                });

                let nextAssigneeId = session.user.id; // Default to self if alone or everyone is away

                if (members.length > 0) {
                    // Filter out current completer if possible
                    let candidates = members.filter(m => m.userId !== session.user.id);

                    if (candidates.length === 0 && members.length > 0) {
                        // Only one person available (likely me, if I am not away).
                        candidates = members;
                    }

                    if (candidates.length > 0) {
                        // Sort by lowest points (Load Balancing)
                        candidates.sort((a, b) => a.user.totalPoints - b.user.totalPoints);
                        nextAssigneeId = candidates[0].userId;
                    }
                }

                // Create next chore instance
                await prisma.chore.create({
                    data: {
                        householdId: chore.householdId,
                        title: chore.title,
                        description: chore.description,
                        points: chore.points,
                        assignedToId: nextAssigneeId,
                        status: "PENDING",
                        dueDate: nextDueDate,
                        recurrence: chore.recurrence,
                        activityLogs: {
                            create: {
                                userId: session.user.id,
                                action: "CREATED",
                            }
                        }
                    },
                });
            }

            return NextResponse.json(updatedChore);
        }

        if (action === "CLAIM") {
            const updatedChore = await prisma.chore.update({
                where: { id },
                data: {
                    assignedToId: session.user.id,
                    activityLogs: {
                        create: {
                            userId: session.user.id,
                            action: "CLAIMED",
                        },
                    },
                },
            });
            return NextResponse.json(updatedChore);
        }

        return new NextResponse("Invalid action", { status: 400 });
    } catch (error) {
        console.error("[CHORE_UPDATE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
