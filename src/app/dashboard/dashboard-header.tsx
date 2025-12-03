"use client";

import { Button } from "@/components/ui/button";
import { InviteCodeButton } from "./invite-code";
import { AddChoreDialog } from "./add-chore-dialog";
import { SettingsDialog } from "./settings-dialog";
import { HelpDialog } from "./help-dialog";
import { ModeToggle } from "@/components/mode-toggle";
import { AchievementsDialog } from "./achievements-dialog";
import { VacationToggle } from "./vacation-toggle";
import { PushNotificationManager } from "@/components/push-manager";
import { getLevel } from "@/lib/levels";
import { Progress } from "@/components/ui/progress";
import { Coins, BarChart3, Flame, Menu, MoreHorizontal, Copy, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

import { UserNav } from "@/components/user-nav";

interface DashboardHeaderProps {
    household: {
        id: string;
        name: string;
        inviteCode: string;
        mode: "STANDARD" | "ECONOMY";
    };
    user: {
        id: string;
        name: string | null;
        email: string | null;
        image: string | null;
        totalPoints: number;
    };
    membership: {
        role: "ADMIN" | "MEMBER";
        balance: number;
        currentStreak: number;
        isAway: boolean;
    };
    achievementsData: any[];
    allHouseholds: { id: string; name: string }[];
}

export function DashboardHeader({
    household,
    user,
    membership,
    achievementsData,
    allHouseholds,
}: DashboardHeaderProps) {
    const levelData = getLevel(user.totalPoints || 0);

    return (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <Link href="/dashboard" className="hover:underline">
                    <h1 className="text-3xl font-bold tracking-tight">{household.name}</h1>
                </Link>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                    <p className="text-muted-foreground text-sm font-medium">{user.name}</p>
                    <span className="inline-flex items-center gap-1 font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full text-xs border border-purple-200">
                        Lvl {levelData.level}: {levelData.title}
                    </span>
                    {household.mode === "ECONOMY" && (
                        <span className="inline-flex items-center gap-1 font-medium text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full text-xs border border-yellow-200">
                            <Coins className="w-3 h-3" />
                            {membership.balance} Gold
                        </span>
                    )}
                    <span className="inline-flex items-center gap-1 font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full text-xs border border-orange-200" title="Current Streak">
                        <Flame className="w-3 h-3 fill-orange-600" />
                        {membership.currentStreak} Day Streak
                    </span>
                </div>
                <div className="mt-2 w-full max-w-[200px] flex items-center gap-2">
                    <Progress value={levelData.progress} className="h-1.5" />
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {Math.floor(levelData.progress)}% to Lvl {levelData.level + 1}
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
                {/* Mobile: Add Chore + More Menu */}
                <div className="flex md:hidden items-center justify-end gap-2 w-full">
                    <AddChoreDialog householdId={household.id} />

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon">
                                <MoreHorizontal className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <div className="p-2">
                                <p className="text-xs text-muted-foreground mb-1">Invite Code</p>
                                <div className="flex items-center justify-between bg-muted/50 p-2 rounded border border-dashed">
                                    <code className="font-mono font-bold">{household.inviteCode}</code>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            navigator.clipboard.writeText(household.inviteCode);
                                            toast.success("Invite code copied!");
                                        }}
                                    >
                                        <Copy className="w-3 h-3" />
                                    </Button>
                                    <VacationToggle householdId={household.id} initialIsAway={membership.isAway} minimal />
                                </div>
                            </div>

                            <DropdownMenuItem asChild>
                                <div className="flex items-center w-full" onClick={(e) => e.preventDefault()}>
                                    <AchievementsDialog achievements={achievementsData} />
                                    <span className="ml-2">Achievements</span>
                                </div>
                            </DropdownMenuItem>
                            {membership.role === "ADMIN" && (
                                <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem asChild>
                                        <div className="flex items-center w-full" onClick={(e) => e.preventDefault()}>
                                            <SettingsDialog householdId={household.id} currentMode={household.mode} />
                                            <span className="ml-2">Settings</span>
                                        </div>
                                    </DropdownMenuItem>
                                </>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <div className="flex items-center w-full justify-between" onClick={(e) => e.preventDefault()}>
                                    <span>Theme</span>
                                    <ModeToggle />
                                </div>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <UserNav
                        user={user}
                        households={allHouseholds}
                        currentHouseholdId={household.id}
                    />
                </div>

                {/* Desktop: Full Row */}
                <div className="hidden md:flex items-center gap-4">
                    <InviteCodeButton code={household.inviteCode} />
                    <Link href="/dashboard/analytics">
                        <Button variant="outline" size="icon" title="Analytics">
                            <BarChart3 className="w-4 h-4" />
                        </Button>
                    </Link>
                    <Link href="/dashboard/shopping-list">
                        <Button variant="outline" size="icon" title="Shopping List">
                            <ShoppingCart className="w-4 h-4" />
                        </Button>
                    </Link>
                    <HelpDialog />
                    <PushNotificationManager />
                    <VacationToggle householdId={household.id} initialIsAway={membership.isAway} />
                    <AchievementsDialog achievements={achievementsData} />
                    {membership.role === "ADMIN" && (
                        <SettingsDialog householdId={household.id} currentMode={household.mode} />
                    )}
                    <ModeToggle />
                    <AddChoreDialog householdId={household.id} />

                    <div className="ml-2 border-l pl-4">
                        <UserNav
                            user={user}
                            households={allHouseholds}
                            currentHouseholdId={household.id}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
