export const LEVELS = [
    { level: 1, xp: 0, title: "Couch Potato 🥔" },
    { level: 2, xp: 100, title: "Dust Bunny Hunter 🐰" },
    { level: 3, xp: 250, title: "Dishwasher Padawan 🍽️" },
    { level: 4, xp: 450, title: "Sock Sorter 🧦" },
    { level: 5, xp: 700, title: "Trash Titan 🗑️" },
    { level: 6, xp: 1000, title: "Broomstick Rider 🧹" },
    { level: 7, xp: 1350, title: "Laundry Lord 🧺" },
    { level: 8, xp: 1750, title: "Vacuum Viper 🐍" },
    { level: 9, xp: 2200, title: "Window Wiper 🪟" },
    { level: 10, xp: 2700, title: "Chore Champion 🏆" },
    { level: 11, xp: 3250, title: "Stain Slayer ⚔️" },
    { level: 12, xp: 3850, title: "Fridge Freezer ❄️" },
    { level: 13, xp: 4500, title: "Garden Guardian 🌻" },
    { level: 14, xp: 5200, title: "Mop Master 🧼" },
    { level: 15, xp: 6000, title: "Tidy Titan 🏰" },
    { level: 20, xp: 10000, title: "Cleanliness Commander 🫡" },
    { level: 25, xp: 15000, title: "Hygiene Hero 🦸" },
    { level: 30, xp: 22000, title: "Sparkle Specialist ✨" },
    { level: 40, xp: 40000, title: "Grime Reaper 💀" },
    { level: 50, xp: 65000, title: "Domestic God ⚡" },
    { level: 60, xp: 100000, title: "Zen Master of Order 🧘" },
    { level: 75, xp: 150000, title: "Galactic Garbage Collector 🚀" },
    { level: 100, xp: 250000, title: "The One Who Cleans 🌌" },
];

export function getLevel(xp: number) {
    // Find the highest level where level.xp <= xp
    // Since the array is sorted by level/xp, we can reverse find or just iterate
    let currentLevel = LEVELS[0];
    let nextLevel = LEVELS[1];

    for (let i = 0; i < LEVELS.length; i++) {
        if (xp >= LEVELS[i].xp) {
            currentLevel = LEVELS[i];
            nextLevel = LEVELS[i + 1] || null;
        } else {
            break;
        }
    }

    // Calculate progress to next level
    let progress = 0;
    if (nextLevel) {
        const xpNeeded = nextLevel.xp - currentLevel.xp;
        const xpGained = xp - currentLevel.xp;
        progress = Math.min(100, Math.max(0, (xpGained / xpNeeded) * 100));
    } else {
        progress = 100; // Max level
    }

    return {
        level: currentLevel.level,
        title: currentLevel.title,
        progress,
        nextLevelXp: nextLevel ? nextLevel.xp : null,
        currentLevelXp: currentLevel.xp,
    };
}
