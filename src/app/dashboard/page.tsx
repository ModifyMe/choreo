import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Leaderboard } from "./leaderboard";
import { ChoreList } from "./chore-list";
import { Shop } from "./shop";
import { AddRewardDialog } from "./add-reward-dialog";
import { ActivityFeed } from "./activity-feed";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChoreProvider } from "./chore-context";
import { DashboardHeader } from "./dashboard-header";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        redirect("/api/auth/signin");
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: {
            memberships: {
                include: {
                    household: true,
                },
            },
        },
    });

    if (!user) {
        redirect("/api/auth/signin");
    }

    const membership = user.memberships[0];

    if (!membership) {
        redirect("/onboarding");
    }

    const household = membership.household;

    const myChores = await prisma.chore.findMany({
        where: {
            householdId: household.id,
            assignedToId: user.id,
            status: "PENDING",
        },
        orderBy: { createdAt: "desc" },
    });

    const availableChores = await prisma.chore.findMany({
        where: {
            householdId: household.id,
            assignedToId: null,
            status: "PENDING",
        },
        orderBy: { createdAt: "desc" },
    });

    let rewards: any[] = [];
    if (household.mode === "ECONOMY") {
        rewards = await prisma.reward.findMany({
            where: { householdId: household.id },
            orderBy: { cost: "asc" },
        });
    }

    const activityLogs = await prisma.activityLog.findMany({
        where: { householdId: household.id },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
            user: {
                select: {
                    name: true,
                },
            },
            chore: {
                select: {
                    title: true,
                }
            }
        }
    });

    const allAchievements = await prisma.achievement.findMany();
    const userAchievements = await prisma.userAchievement.findMany({
        where: { userId: user.id },
    });

    const achievementsData = allAchievements.map((ach) => ({
        ...ach,
        unlockedAt: userAchievements.find((ua) => ua.achievementId === ach.id)?.unlockedAt,
    }));

    return (
        <div className="min-h-screen bg-muted/30 p-6">
            <ChoreProvider initialMyChores={myChores as any} initialAvailableChores={availableChores as any} userId={user.id}>
                <div className="max-w-6xl mx-auto space-y-8">
                    <DashboardHeader
                        household={household as any}
                        user={user}
                        membership={membership as any}
                        achievementsData={achievementsData}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Main Content Area - Chores */}
                        <div className="md:col-span-2 space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>My Chores</CardTitle>
                                </CardHeader>
                                <ChoreList userId={user.id} type="my" />
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Available Chores</CardTitle>
                                </CardHeader>
                                <ChoreList userId={user.id} type="available" />
                            </Card>


                            {household.mode === "ECONOMY" && (
                                <div className="space-y-4 pt-4 border-t">
                                    <div className="flex justify-between items-center">
                                        <h2 className="text-xl font-semibold tracking-tight">Rewards Shop</h2>
                                        {membership.role === "ADMIN" && (
                                            <AddRewardDialog householdId={household.id} />
                                        )}
                                    </div>
                                    <Shop
                                        rewards={rewards}
                                        userBalance={membership.balance}
                                        isAdmin={membership.role === "ADMIN"}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Sidebar - Leaderboard & Activity */}
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Leaderboard</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Leaderboard householdId={household.id} />
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Recent Activity</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ActivityFeed logs={activityLogs} />
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </ChoreProvider>
        </div>
    );
}
