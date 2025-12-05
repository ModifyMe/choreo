"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Trophy } from "lucide-react";
import { AchievementsList } from "./achievements-list";
import { useState } from "react";

interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    unlockedAt?: Date;
}

interface AchievementsDialogProps {
    achievements: Achievement[];
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function AchievementsDialog({ achievements, open, onOpenChange }: AchievementsDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const unlockedCount = achievements.filter((a) => a.unlockedAt).length;

    const isControlled = open !== undefined;
    const finalOpen = isControlled ? open : internalOpen;
    const finalSetOpen = isControlled ? onOpenChange : setInternalOpen;

    return (
        <Dialog open={finalOpen} onOpenChange={finalSetOpen}>
            {!isControlled && (
                <DialogTrigger asChild>
                    <Button variant="outline" size="icon" title="Achievements" className="h-8 w-8">
                        <Trophy className="h-4 w-4" />
                    </Button>
                </DialogTrigger>
            )}
            <DialogContent className="w-[calc(100vw-2rem)] max-w-[600px] max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Achievements</DialogTitle>
                    <DialogDescription>
                        You have unlocked {unlockedCount} / {achievements.length} achievements.
                    </DialogDescription>
                </DialogHeader>
                <div className="max-h-[60vh] overflow-y-auto">
                    <AchievementsList achievements={achievements} />
                </div>
            </DialogContent>
        </Dialog>
    );
}

