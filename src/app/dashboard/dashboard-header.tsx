"use client";

import { Button } from "@/components/ui/button";
import { InviteCodeButton } from "./invite-code";
import dynamic from "next/dynamic";
import { ModeToggle } from "@/components/mode-toggle";
import { VacationToggle } from "./vacation-toggle";
import { PushNotificationManager } from "@/components/push-manager";

// Lazy load heavy dialog components
const AddChoreDialog = dynamic(() => import("./add-chore-dialog").then(mod => mod.AddChoreDialog), { ssr: false });
const SettingsDialog = dynamic(() => import("./settings-dialog").then(mod => mod.SettingsDialog), { ssr: false });
const HelpDialog = dynamic(() => import("./help-dialog").then(mod => mod.HelpDialog), { ssr: false });
const AchievementsDialog = dynamic(() => import("./achievements-dialog").then(mod => mod.AchievementsDialog), { ssr: false });
const CalendarDialog = dynamic(() => import("./calendar-dialog").then(mod => mod.CalendarDialog), { ssr: false });


// ... existing imports ...
import { getLevel } from "@/lib/levels";
import { Progress } from "@/components/ui/progress";
import { Coins, BarChart3, Flame, Menu, MoreHorizontal, Copy, ShoppingCart, Settings, Link as LinkIcon, Calendar } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
        assignmentStrategy?: "LOAD_BALANCING" | "STRICT_ROTATION" | "RANDOM" | "NONE";
        allowMemberDelete?: boolean;
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
        totalPoints: number;
    };
    achievementsData: any[];
    allHouseholds: { id: string; name: string }[];
    members: any[];
    householdChores: any[];
}

export function DashboardHeader({
    household,
    user,
    membership,
    achievementsData,
    allHouseholds,
    members,
    householdChores,
}: DashboardHeaderProps) {
    const levelData = getLevel(membership.totalPoints || 0);
    const router = useRouter();

    const [settingsOpen, setSettingsOpen] = useState(false);

    useEffect(() => {
        router.prefetch("/dashboard/shopping-list");
    }, [router]);

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
                {/* Mobile: Simplified - just Add Chore, Notifications, User */}
                <div className="flex md:hidden items-center justify-end gap-2 w-full">
                    <PushNotificationManager />
                    <AddChoreDialog householdId={household.id} />
                    <UserNav
                        user={user}
                        households={allHouseholds}
                        currentHouseholdId={household.id}
                        inviteCode={household.inviteCode}
                        isAway={membership.isAway}
                        achievements={achievementsData}
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
                        <Button variant="secondary" className="gap-2">
                            <ShoppingCart className="w-4 h-4" />
                            Shopping List
                        </Button>
                    </Link>
                    <PushNotificationManager />
                    <CalendarDialog userId={user.id} />
                    <HelpDialog />
                    {membership.role === "ADMIN" && (
                        <Button variant="outline" size="icon" onClick={() => setSettingsOpen(true)}>
                            <Settings className="w-4 h-4" />
                        </Button>
                    )}
                    <AddChoreDialog householdId={household.id} />

                    <div className="ml-2 border-l pl-4">
                        <UserNav
                            user={user}
                            households={allHouseholds}
                            currentHouseholdId={household.id}
                            inviteCode={household.inviteCode}
                            isAway={membership.isAway}
                            achievements={achievementsData}
                        />
                    </div>
                </div>
            </div>

            {/* Controlled Settings Dialog */}
            {membership.role === "ADMIN" && (
                <SettingsDialog
                    householdId={household.id}
                    currentMode={household.mode}
                    currentStrategy={household.assignmentStrategy}
                    allowMemberDelete={household.allowMemberDelete}
                    members={members}
                    open={settingsOpen}
                    onOpenChange={setSettingsOpen}
                />
            )}
        </div>
    );
}
