"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const CHORE_EMOJIS = ["🧹", "🧽", "🧼", "🧺", "🗑️", "🍽️", "👕", "🪴", "🪣", "🧴"];

interface EmojiProps {
    emoji: string;
    delay: number;
    duration: number;
    x: number;
    layer: number;
}

function FallingEmoji({ emoji, delay, duration, x, layer }: EmojiProps) {
    // Layer 1: Closest, fastest, most opaque
    // Layer 2: Middle
    // Layer 3: Furthest, slowest, most transparent

    const opacity = layer === 1 ? 0.8 : layer === 2 ? 0.5 : 0.3;
    const scale = layer === 1 ? 1.5 : layer === 2 ? 1 : 0.7;
    const blur = layer === 3 ? "1px" : "0px";

    return (
        <motion.div
            initial={{ y: -100, rotate: 0, opacity: 0 }}
            animate={{
                y: "110vh",
                rotate: 360,
                opacity: [0, opacity, opacity, 0], // Fade in, stay, fade out
            }}
            transition={{
                duration: duration,
                delay: delay,
                repeat: Infinity,
                ease: "linear",
            }}
            style={{
                position: "absolute",
                top: 0,
                left: `${x}%`,
                fontSize: "2rem",
                scale,
                filter: `blur(${blur})`,
                zIndex: -10 + layer, // Ensure they are behind content but layered correctly
                pointerEvents: "none",
            }}
        >
            {emoji}
        </motion.div>
    );
}

export function FallingEmojis() {
    const [emojis, setEmojis] = useState<EmojiProps[]>([]);

    useEffect(() => {
        const count = 40; // Increased count slightly
        const newEmojis: EmojiProps[] = [];

        for (let i = 0; i < count; i++) {
            const layer = Math.floor(Math.random() * 3) + 1; // 1, 2, or 3
            const baseDuration = layer === 1 ? 10 : layer === 2 ? 15 : 20;

            // Sparse center logic:
            // 0-30%: 40% chance
            // 30-70%: 20% chance (Sparse)
            // 70-100%: 40% chance
            let xPosition;
            const seed = Math.random();
            if (seed < 0.4) {
                xPosition = Math.random() * 30; // Left side
            } else if (seed > 0.6) {
                xPosition = 70 + Math.random() * 30; // Right side
            } else {
                xPosition = 30 + Math.random() * 40; // Center (sparse)
            }

            newEmojis.push({
                emoji: CHORE_EMOJIS[Math.floor(Math.random() * CHORE_EMOJIS.length)],
                delay: Math.random() * 20, // Spread start times
                duration: baseDuration + Math.random() * 5,
                x: xPosition,
                layer: layer,
            });
        }
        setEmojis(newEmojis);
    }, []);

    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none select-none z-0">
            {emojis.map((props, i) => (
                <FallingEmoji key={i} {...props} />
            ))}
        </div>
    );
}
