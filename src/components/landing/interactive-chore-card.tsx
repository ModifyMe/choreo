"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Flame } from "lucide-react";
import confetti from "canvas-confetti";
import { cn } from "@/lib/utils";

export function InteractiveChoreCard() {
    const [completed, setCompleted] = useState(false);
    const [pointsVisible, setPointsVisible] = useState(false);

    const handleClick = (e: React.MouseEvent) => {
        if (completed) return;

        setCompleted(true);
        setPointsVisible(true);

        // Confetti burst from the cursor position (roughly)
        // We can't easily get exact screen coordinates for canvas-confetti origin (0-1) from mouse event without math.
        // Let's just do a nice spread from the bottom center of the screen or just a default burst.
        const rect = (e.target as HTMLElement).getBoundingClientRect();
        const x = (rect.left + rect.width / 2) / window.innerWidth;
        const y = (rect.top + rect.height / 2) / window.innerHeight;

        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: y, x: x },
            colors: ['#a855f7', '#ec4899', '#3b82f6'] // Purple, Pink, Blue
        });

        // Reset after 2.5 seconds
        setTimeout(() => {
            setCompleted(false);
            setPointsVisible(false);
        }, 2500);
    };

    return (
        <div className="relative group cursor-pointer" onClick={handleClick}>
            {/* Floating Points Animation */}
            <AnimatePresence>
                {pointsVisible && (
                    <motion.div
                        initial={{ opacity: 0, y: 0, scale: 0.5 }}
                        animate={{ opacity: 1, y: -50, scale: 1.2 }}
                        exit={{ opacity: 0, y: -80 }}
                        className="absolute -top-8 right-0 left-0 mx-auto w-max z-50 pointer-events-none"
                    >
                        <span className="text-2xl font-bold text-green-500 drop-shadow-sm flex items-center gap-1">
                            +50 <span className="text-lg">pts</span>
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* The Card */}
            <motion.div
                whileHover={{ scale: 1.02, rotate: -1 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                    "w-full max-w-sm mx-auto bg-card border rounded-xl p-4 shadow-lg transition-all duration-300",
                    completed ? "border-green-500/50 bg-green-50/10" : "hover:border-primary/50"
                )}
            >
                <div className="flex items-center gap-4">
                    {/* Checkbox */}
                    <div
                        className={cn(
                            "h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors duration-300",
                            completed
                                ? "bg-green-500 border-green-500"
                                : "border-muted-foreground group-hover:border-primary"
                        )}
                    >
                        {completed && <Check className="w-4 h-4 text-white" />}
                    </div>

                    {/* Content */}
                    <div className="flex-1 text-left">
                        <h3
                            className={cn(
                                "font-medium text-lg transition-all duration-300",
                                completed ? "line-through text-muted-foreground" : "text-foreground"
                            )}
                        >
                            Take out the trash
                        </h3>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Flame className="w-3 h-3 text-orange-500" />
                            High Priority
                        </p>
                    </div>

                    {/* Points Badge */}
                    <div className={cn(
                        "px-2 py-1 rounded-md text-xs font-bold transition-colors duration-300",
                        completed ? "bg-green-100 text-green-700" : "bg-primary/10 text-primary"
                    )}>
                        50 pts
                    </div>
                </div>
            </motion.div>

            {/* Hint Text */}
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: completed ? 0 : 0.5 }}
                className="text-xs text-muted-foreground mt-2 text-center"
            >
                (Click me!)
            </motion.p>
        </div>
    );
}
