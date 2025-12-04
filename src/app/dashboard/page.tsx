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
import { RewardProvider } from "./reward-context";
// import { TestPushButton } from "./test-push-button";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
    searchParams,
}: {
    searchParams: { [key: string]: string | string[] | undefined };
}) {
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

    if (user.memberships.length === 0) {
        redirect("/onboarding");
    }

    // Determine which household to show
    const householdId = searchParams?.householdId as string;
    let membership = user.memberships[0];

    if (householdId) {
        const found = user.memberships.find((m) => m.householdId === householdId);
        if (found) {
            membership = found;
        }
    }

    const household = membership.household;
    const allHouseholds = user.memberships.map((m) => m.household);

    const [allChores, rewards] = await Promise.all([
        prisma.chore.findMany({
            where: {
                householdId: household.id,
                status: "PENDING",
            },
            include: {
                assignedTo: {
                    select: {
                        name: true,
                        image: true,
                    }
                }
            },
            orderBy: { createdAt: "desc" },
        }),
        household.mode === "ECONOMY" ? prisma.reward.findMany({
            where: { householdId: household.id },
            orderBy: { cost: "asc" },
        }) : Promise.resolve([]),
    ]);

    return (
        <ChoreProvider initialChores={allChores as any} userId={user.id} householdId={household.id}>
            <RewardProvider initialRewards={rewards as any} householdId={household.id}>
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
                            <CardContent className="p-0">
                                <ActivityFeed householdId={household.id} />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </RewardProvider>
        </ChoreProvider>
    );
}

