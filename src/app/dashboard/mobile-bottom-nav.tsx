"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ShoppingCart, Calendar, Settings, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileBottomNavProps {
    householdId: string;
    onCalendarClick?: () => void;
    onSettingsClick?: () => void;
    onAchievementsClick?: () => void;
}

export function MobileBottomNav({
    householdId,
    onCalendarClick,
    onSettingsClick,
    onAchievementsClick
}: MobileBottomNavProps) {
    const pathname = usePathname();

    const navItems = [
        {
            icon: Home,
            label: "Home",
            href: "/dashboard",
            isActive: pathname === "/dashboard"
        },
        {
            icon: ShoppingCart,
            label: "Shop",
            href: "/dashboard/shopping-list",
            isActive: pathname === "/dashboard/shopping-list"
        },
        {
            icon: Calendar,
            label: "Calendar",
            onClick: onCalendarClick,
            isActive: false
        },
        {
            icon: Trophy,
            label: "Awards",
            onClick: onAchievementsClick,
            isActive: false
        },
        {
            icon: Settings,
            label: "Settings",
            onClick: onSettingsClick,
            isActive: false
        },
    ];

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t z-50 safe-area-bottom">
            <div className="flex justify-around items-center h-16">
                {navItems.map((item) => {
                    const Icon = item.icon;

                    if (item.onClick) {
                        return (
                            <button
                                key={item.label}
                                onClick={item.onClick}
                                className={cn(
                                    "flex flex-col items-center justify-center w-full h-full min-h-[44px] min-w-[44px] gap-1 transition-colors",
                                    item.isActive
                                        ? "text-primary"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <Icon className="h-5 w-5" />
                                <span className="text-[10px] font-medium">{item.label}</span>
                            </button>
                        );
                    }

                    return (
                        <Link
                            key={item.label}
                            href={item.href!}
                            className={cn(
                                "flex flex-col items-center justify-center w-full h-full min-h-[44px] min-w-[44px] gap-1 transition-colors",
                                item.isActive
                                    ? "text-primary"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Icon className="h-5 w-5" />
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
