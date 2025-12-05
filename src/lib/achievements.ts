import { prisma } from "./prisma";

export const ACHIEVEMENTS = [
    // === CHORE MILESTONES ===
    {
        name: "First Chore",
        description: "Complete your first chore.",
        icon: "🧹",
        condition: "CHORES_COMPLETED:1",
    },
    {
        name: "Getting Started",
        description: "Complete 5 chores.",
        icon: "✅",
        condition: "CHORES_COMPLETED:5",
    },
    {
        name: "Task Master",
        description: "Complete 10 chores.",
        icon: "🏆",
        condition: "CHORES_COMPLETED:10",
    },
    {
        name: "Chore Champion",
        description: "Complete 25 chores.",
        icon: "🥇",
        condition: "CHORES_COMPLETED:25",
    },
    {
        name: "Cleaning Machine",
        description: "Complete 50 chores.",
        icon: "🤖",
        condition: "CHORES_COMPLETED:50",
    },
    {
        name: "Legendary Helper",
        description: "Complete 100 chores.",
        icon: "👑",
        condition: "CHORES_COMPLETED:100",
    },
    {
        name: "Unstoppable Force",
        description: "Complete 250 chores.",
        icon: "⚡",
        condition: "CHORES_COMPLETED:250",
    },
    {
        name: "Chore God",
        description: "Complete 500 chores.",
        icon: "🌟",
        condition: "CHORES_COMPLETED:500",
    },

    // === POINTS MILESTONES ===
    {
        name: "High Roller",
        description: "Earn 100 points total.",
        icon: "💰",
        condition: "POINTS_EARNED:100",
    },
    {
        name: "Money Maker",
        description: "Earn 500 points total.",
        icon: "💎",
        condition: "POINTS_EARNED:500",
    },
    {
        name: "Point Collector",
        description: "Earn 1,000 points total.",
        icon: "🏦",
        condition: "POINTS_EARNED:1000",
    },
    {
        name: "Wealthy Worker",
        description: "Earn 2,500 points total.",
        icon: "💵",
        condition: "POINTS_EARNED:2500",
    },
    {
        name: "Point Millionaire",
        description: "Earn 5,000 points total.",
        icon: "🤑",
        condition: "POINTS_EARNED:5000",
    },

    // === REWARD MILESTONES ===
    {
        name: "Big Spender",
        description: "Redeem your first reward.",
        icon: "🛍️",
        condition: "REWARDS_REDEEMED:1",
    },
    {
        name: "Treat Yourself",
        description: "Redeem 5 rewards.",
        icon: "🎁",
        condition: "REWARDS_REDEEMED:5",
    },
    {
        name: "Shopaholic",
        description: "Redeem 10 rewards.",
        icon: "🛒",
        condition: "REWARDS_REDEEMED:10",
    },
    {
        name: "Reward Hunter",
        description: "Redeem 25 rewards.",
        icon: "🎯",
        condition: "REWARDS_REDEEMED:25",
    },

    // === STREAK ACHIEVEMENTS ===
    {
        name: "On Fire",
        description: "Complete chores 3 days in a row.",
        icon: "🔥",
        condition: "STREAK:3",
    },
    {
        name: "Week Warrior",
        description: "Complete chores 7 days in a row.",
        icon: "📅",
        condition: "STREAK:7",
    },
    {
        name: "Two Week Terror",
        description: "Complete chores 14 days in a row.",
        icon: "💪",
        condition: "STREAK:14",
    },
    {
        name: "Monthly Master",
        description: "Complete chores 30 days in a row.",
        icon: "🗓️",
        condition: "STREAK:30",
    },

    // === SPECIAL ACHIEVEMENTS ===
    {
        name: "Early Bird",
        description: "Complete a chore before 9 AM.",
        icon: "🐦",
        condition: "EARLY_BIRD:1",
    },
    {
        name: "Night Owl",
        description: "Complete a chore after 10 PM.",
        icon: "🦉",
        condition: "NIGHT_OWL:1",
    },
    {
        name: "Weekend Warrior",
        description: "Complete 5 chores on a weekend.",
        icon: "🎉",
        condition: "WEEKEND_CHORES:5",
    },
    {
        name: "Speed Demon",
        description: "Complete 3 chores in one day.",
        icon: "💨",
        condition: "DAILY_CHORES:3",
    },
    {
        name: "Overachiever",
        description: "Complete 5 chores in one day.",
        icon: "🚀",
        condition: "DAILY_CHORES:5",
    },
];

export async function checkAchievements(userId: string) {
    // 1. Ensure achievements exist in DB (Lazy Sync)
    for (const ach of ACHIEVEMENTS) {
        await prisma.achievement.upsert({
            where: { id: ach.name },
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
        select: { totalPoints: true, currentStreak: true },
    });
    const totalPoints = userMemberships.reduce((sum, m) => sum + m.totalPoints, 0);
    const currentStreak = Math.max(...userMemberships.map(m => m.currentStreak), 0);

    // Get today's completed chores count
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dailyChoresCompleted = await prisma.activityLog.count({
        where: {
            userId,
            action: "COMPLETED",
            createdAt: { gte: today },
        },
    });

    // Get the latest completed chore's time for time-based achievements
    const latestCompletion = await prisma.activityLog.findFirst({
        where: { userId, action: "COMPLETED" },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
    });
    const latestHour = latestCompletion ? new Date(latestCompletion.createdAt).getHours() : -1;

    // Weekend chores (this weekend)
    const dayOfWeek = new Date().getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    let weekendChores = 0;
    if (isWeekend) {
        const weekendStart = new Date();
        weekendStart.setDate(weekendStart.getDate() - (dayOfWeek === 0 ? 1 : 0)); // Go to Saturday
        weekendStart.setHours(0, 0, 0, 0);
        weekendChores = await prisma.activityLog.count({
            where: {
                userId,
                action: "COMPLETED",
                createdAt: { gte: weekendStart },
            },
        });
    }

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
            case "STREAK":
                passed = currentStreak >= threshold;
                break;
            case "DAILY_CHORES":
                passed = dailyChoresCompleted >= threshold;
                break;
            case "EARLY_BIRD":
                passed = latestHour >= 0 && latestHour < 9;
                break;
            case "NIGHT_OWL":
                passed = latestHour >= 22;
                break;
            case "WEEKEND_CHORES":
                passed = weekendChores >= threshold;
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

