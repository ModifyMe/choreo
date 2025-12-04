import { prisma } from "./prisma";

export const ACHIEVEMENTS = [
    {
        name: "First Chore",
        description: "Complete your first chore.",
        icon: "🧹",
        condition: "CHORES_COMPLETED:1",
    },
    {
        name: "Task Master",
        description: "Complete 10 chores.",
        icon: "🏆",
        condition: "CHORES_COMPLETED:10",
    },
    {
        name: "High Roller",
        description: "Earn 100 points total.",
        icon: "💰",
        condition: "POINTS_EARNED:100",
    },
    {
        name: "Big Spender",
        description: "Redeem your first reward.",
        icon: "🛍️",
        condition: "REWARDS_REDEEMED:1",
    },
];

export async function checkAchievements(userId: string) {
    // 1. Ensure achievements exist in DB (Lazy Sync)
    for (const ach of ACHIEVEMENTS) {
        await prisma.achievement.upsert({
            where: { id: ach.name }, // Using name as ID for simplicity in this MVP, or we'd need a unique name field
            create: {
                id: ach.name,
                name: ach.name,
                description: ach.description,
                icon: ach.icon,
                condition: ach.condition,
            },
            update: {
                description: ach.description,
                icon: ach.icon,
                condition: ach.condition,
            },
        });
    }

    // 2. Fetch user stats
    const choresCompleted = await prisma.activityLog.count({
        where: { userId, action: "COMPLETED" },
    });

    const rewardsRedeemed = await prisma.activityLog.count({
        where: { userId, action: "REDEEMED" },
    });

    const userMemberships = await prisma.membership.findMany({
        where: { userId },
        select: { totalPoints: true },
    });
    const totalPoints = userMemberships.reduce((sum, m) => sum + m.totalPoints, 0);

    // 3. Check and award
    const newUnlocks: string[] = [];

    for (const ach of ACHIEVEMENTS) {
        const [type, thresholdStr] = ach.condition.split(":");
        const threshold = parseInt(thresholdStr);
        let passed = false;

        switch (type) {
            case "CHORES_COMPLETED":
                passed = choresCompleted >= threshold;
                break;
            case "POINTS_EARNED":
                passed = totalPoints >= threshold;
                break;
            case "REWARDS_REDEEMED":
                passed = rewardsRedeemed >= threshold;
                break;
        }

        if (passed) {
            // Check if already unlocked
            const existing = await prisma.userAchievement.findUnique({
                where: {
                    userId_achievementId: {
                        userId,
                        achievementId: ach.name,
                    },
                },
            });

            if (!existing) {
                await prisma.userAchievement.create({
                    data: {
                        userId,
                        achievementId: ach.name,
                    },
                });
                newUnlocks.push(ach.name);
            }
        }
    }

    return newUnlocks;
}
