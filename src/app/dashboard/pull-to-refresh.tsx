"use client";

import { useState, useCallback, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface PullToRefreshProps {
    children: ReactNode;
    className?: string;
}

export function PullToRefresh({ children, className }: PullToRefreshProps) {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [pullDistance, setPullDistance] = useState(0);
    const router = useRouter();

    const PULL_THRESHOLD = 80;
    const MAX_PULL = 120;

    let startY = 0;
    let isPulling = false;

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        // Only enable pull-to-refresh when at top of page
        if (window.scrollY === 0) {
            startY = e.touches[0].clientY;
            isPulling = true;
        }
    }, []);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (!isPulling || isRefreshing) return;

        const currentY = e.touches[0].clientY;
        const diff = currentY - startY;

        if (diff > 0 && window.scrollY === 0) {
            // Apply resistance to pull
            const resistance = 0.5;
            const distance = Math.min(diff * resistance, MAX_PULL);
            setPullDistance(distance);
        }
    }, [isRefreshing]);

    const handleTouchEnd = useCallback(async () => {
        if (!isPulling) return;
        isPulling = false;

        if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
            setIsRefreshing(true);

            // Trigger refresh
            router.refresh();

            // Wait a bit for visual feedback
            await new Promise(resolve => setTimeout(resolve, 1000));

            setIsRefreshing(false);
        }

        setPullDistance(0);
    }, [pullDistance, isRefreshing, router]);

    const showIndicator = pullDistance > 0 || isRefreshing;
    const indicatorProgress = Math.min(pullDistance / PULL_THRESHOLD, 1);

    return (
        <div
            className={cn("relative", className)}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* Pull indicator */}
            {showIndicator && (
                <div
                    className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center z-50 transition-transform"
                    style={{
                        top: Math.max(pullDistance - 40, 8),
                        opacity: Math.min(indicatorProgress, 1)
                    }}
                >
                    <div className={cn(
                        "bg-background border rounded-full p-2 shadow-lg",
                        isRefreshing && "animate-spin"
                    )}>
                        <RefreshCw
                            className="h-5 w-5 text-primary"
                            style={{
                                transform: `rotate(${indicatorProgress * 360}deg)`,
                                transition: 'transform 0.1s ease-out'
                            }}
                        />
                    </div>
                </div>
            )}

            {/* Content with pull offset */}
            <div
                style={{
                    transform: `translateY(${isRefreshing ? 50 : pullDistance}px)`,
                    transition: !isPulling ? 'transform 0.2s ease-out' : 'none'
                }}
            >
                {children}
            </div>
        </div>
    );
}
