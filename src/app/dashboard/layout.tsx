import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { DashboardLayoutClient } from "./dashboard-layout-client";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
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

    const householdIds = user.memberships.map((m) => m.householdId);
    const allHouseholds = user.memberships.map((m) => m.household);

    const [allAchievements, userAchievements, allMembers, allChores, allRewards] = await Promise.all([
        prisma.achievement.findMany(),
        prisma.userAchievement.findMany({
            where: { userId: user.id },
        }),
        prisma.membership.findMany({
            where: { householdId: { in: householdIds } },
            include: { user: true },
        }),
        prisma.chore.findMany({
            where: {
                householdId: { in: householdIds },
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
        prisma.reward.findMany({
            where: { householdId: { in: householdIds } },
            orderBy: { cost: "asc" },
        })
    ]);

    const achievementsData = allAchievements.map((ach) => ({
        ...ach,
        unlockedAt: userAchievements.find((ua) => ua.achievementId === ach.id)?.unlockedAt,
    }));

    return (
        <DashboardLayoutClient
            user={user}
            achievementsData={achievementsData}
            allHouseholds={allHouseholds}
            allMembers={allMembers}
            allChores={allChores}
            allRewards={allRewards}
        >
            {children}
        </DashboardLayoutClient>
    );
}
