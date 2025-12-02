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

            // Prevent spam completion (Lock until due date)
            if (chore.dueDate) {
                const now = new Date();
                const due = new Date(chore.dueDate);
                // Reset hours to compare just the dates
                now.setHours(0, 0, 0, 0);
                due.setHours(0, 0, 0, 0);

                if (due > now) {
                    return new NextResponse("Chore is locked until due date", { status: 400 });
                }
            }

            // Calculate Streak
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            let newStreak = membership.currentStreak;
            let lastDate = membership.lastChoreDate;

            if (lastDate) {
                lastDate.setHours(0, 0, 0, 0);
                const diffTime = Math.abs(today.getTime() - lastDate.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays === 1) {
                    // Consecutive day
                    newStreak += 1;
                } else if (diffDays > 1) {
                    // Streak broken
                    newStreak = 1;
                }
                // If diffDays === 0 (same day), keep streak as is
            } else {
                // First chore ever
                newStreak = 1;
            }

            const transactionOperations: any[] = [
                prisma.chore.update({
                    where: { id },
                    data: {
                        status: "COMPLETED",
                        activityLogs: {
                            create: {
                                userId: session.user.id,
                                householdId: chore.householdId,
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
                // Update Membership Streak
                prisma.membership.update({
                    where: {
                        userId_householdId: {
                            userId: session.user.id,
                            householdId: chore.householdId,
                        },
                    },
                    data: {
                        currentStreak: newStreak,
                        lastChoreDate: new Date(),
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
                } else if (chore.recurrence === "MONTHLY") {
                    nextDueDate.setMonth(nextDueDate.getMonth() + 1);
                } else if (chore.recurrence === "BI_MONTHLY") {
                    nextDueDate.setMonth(nextDueDate.getMonth() + 2);
                } else if (chore.recurrence === "CUSTOM" && chore.recurrenceData) {
                    try {
                        const days = JSON.parse(chore.recurrenceData) as string[];
                        const dayMap: { [key: string]: number } = {
                            "SUN": 0, "MON": 1, "TUE": 2, "WED": 3, "THU": 4, "FRI": 5, "SAT": 6
                        };

                        const currentDay = nextDueDate.getDay();
                        let daysUntilNext = 7; // Default max wait

                        // Find the smallest gap to a future day
                        for (const day of days) {
                            const targetDay = dayMap[day];
                            if (targetDay !== undefined) {
                                let diff = targetDay - currentDay;
                                if (diff <= 0) diff += 7; // It's next week
                                if (diff < daysUntilNext) {
                                    daysUntilNext = diff;
                                }
                            }
                        }
                        nextDueDate.setDate(nextDueDate.getDate() + daysUntilNext);
                    } catch (e) {
                        // Fallback to weekly if parsing fails
                        nextDueDate.setDate(nextDueDate.getDate() + 7);
                    }
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
                        recurrenceData: chore.recurrenceData, // Copy custom data
                        activityLogs: {
                            create: {
                                userId: session.user.id,
                                householdId: chore.householdId,
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
                            householdId: chore.householdId,
                            action: "CLAIMED",
                        },
                    },
                },
            });
            return NextResponse.json(updatedChore);
        }

        if (action === "EDIT") {
            const { title, description, points, dueDate, recurrence, recurrenceData } = body;

            const updatedChore = await prisma.chore.update({
                where: { id },
                data: {
                    title,
                    description,
                    points: Number(points),
                    dueDate: dueDate ? new Date(dueDate) : null,
                    recurrence,
                    recurrenceData,
                    activityLogs: {
                        create: {
                            userId: session.user.id,
                            householdId: chore.householdId,
                            action: "UPDATED",
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

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const { id } = await params;

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

        // Allow deletion if user is the creator (if we tracked that, but we don't explicitly yet, so allow any member for now)
        // OR if they are an admin. For now, assuming any member can delete to keep it simple as per "household" trust model.
        // Ideally we should check if membership.role === 'ADMIN' or if they created it.
        // Let's stick to the trust model for now.

        await prisma.chore.delete({
            where: { id },
        });

        return new NextResponse("Chore deleted", { status: 200 });
    } catch (error) {
        console.error("[CHORE_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
