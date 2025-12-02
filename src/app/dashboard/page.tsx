import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InviteCode } from "./invite-code";
import { Leaderboard } from "./leaderboard";
import { AddChoreDialog } from "./add-chore-dialog";
import { ChoreList } from "./chore-list";
import { Shop } from "./shop";
import { AddRewardDialog } from "./add-reward-dialog";
import { SettingsDialog } from "./settings-dialog";
import { ModeToggle } from "@/components/mode-toggle";
import { ActivityFeed } from "./activity-feed";
import { AchievementsDialog } from "./achievements-dialog";
import { VacationToggle } from "./vacation-toggle";
import { PushNotificationManager } from "@/components/push-manager";
import { Coins, BarChart3, Flame } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

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
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{household.name}</h1>
                        <p className="text-muted-foreground flex items-center gap-2">
                            Welcome back, {user.name}
                            {household.mode === "ECONOMY" && (
                                <span className="inline-flex items-center gap-1 font-medium text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full text-sm border border-yellow-200">
                                    <Coins className="w-3 h-3" />
                                    {membership.balance} Gold
                                </span>
                            )}
                            <span className="inline-flex items-center gap-1 font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full text-sm border border-orange-200" title="Current Streak">
                                <Flame className="w-3 h-3 fill-orange-600" />
                                {membership.currentStreak} Day Streak
                            </span>
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <InviteCode code={household.inviteCode} />
                        <Link href="/dashboard/analytics">
                            <Button variant="outline" size="icon" title="Analytics">
                                <BarChart3 className="w-4 h-4" />
                            </Button>
                        </Link>
                        <PushNotificationManager />
                        <VacationToggle householdId={household.id} initialIsAway={membership.isAway} />
                        <AchievementsDialog achievements={achievementsData} />
                        {membership.role === "ADMIN" && (
                            <SettingsDialog householdId={household.id} currentMode={household.mode} />
                        )}
                        <ModeToggle />
                        <AddChoreDialog householdId={household.id} />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Main Content Area - Chores */}
                    <div className="md:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>My Chores</CardTitle>
                            </CardHeader>
                            <ChoreList chores={myChores} userId={user.id} type="my" />
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Available Chores</CardTitle>
                            </CardHeader>
                            <ChoreList chores={availableChores} userId={user.id} type="available" />
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
                            <ActivityFeed logs={activityLogs} />
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
