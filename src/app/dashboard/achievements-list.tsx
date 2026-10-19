"use client";

import { cn } from "@/lib/utils";

interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    unlockedAt?: Date;
}

export function AchievementsList({ achievements }: { achievements: Achievement[] }) {
    return (
        <div className="grid min-w-0 grid-cols-1 min-[400px]:grid-cols-2 gap-3">
            {achievements.map((ach) => (
                <div
                    key={ach.id}
                    className={cn(
                        "flex flex-col items-center justify-center p-4 border rounded-lg text-center space-y-2 transition-colors",
                        ach.unlockedAt
                            ? "bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800"
                            : "bg-muted/50 opacity-60 grayscale"
                    )}
                >
                    <div className="text-3xl">{ach.icon}</div>
                    <div>
                        <p className="break-words font-semibold text-sm">{ach.name}</p>
                        <p className="break-words text-xs text-muted-foreground">{ach.description}</p>
                    </div>
                    {ach.unlockedAt && (
                        <span className="text-[10px] font-bold text-yellow-600 dark:text-yellow-500 bg-yellow-100 dark:bg-yellow-900/50 px-2 py-0.5 rounded-full">
                            UNLOCKED
                        </span>
                    )}
                </div>
            ))}
        </div>
    );
}
