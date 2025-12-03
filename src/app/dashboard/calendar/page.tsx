import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ChoreProvider } from "../chore-context";
import { CalendarView } from "./calendar-view";
import { DashboardHeader } from "../dashboard-header";

export default async function CalendarPage() {
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

    if (!user || user.memberships.length === 0) {
        redirect("/onboarding");
    }

    const membership = user.memberships[0];
    const household = membership.household;
    const allHouseholds = user.memberships.map((m) => m.household);

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
            <ChoreProvider initialMyChores={myChores as any} initialAvailableChores={availableChores as any} userId={user.id} householdId={household.id}>
                <div className="max-w-6xl mx-auto space-y-8">
                    <DashboardHeader
                        household={household as any}
                        user={user}
                        membership={membership as any}
                        achievementsData={achievementsData}
                        allHouseholds={allHouseholds}
                    />
                    <CalendarView userId={user.id} />
                </div>
            </ChoreProvider>
        </div>
    );
}
