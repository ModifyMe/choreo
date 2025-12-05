"use client";

import { useSearchParams } from "next/navigation";
import { DashboardHeader } from "./dashboard-header";
import { ReactNode, useState } from "react";
import { ChoreProvider } from "./chore-context";
import { RewardProvider } from "./reward-context";
import { MobileBottomNav } from "./mobile-bottom-nav";
import dynamic from "next/dynamic";

// Lazy load dialogs for bottom nav
const CalendarDialog = dynamic(() => import("./calendar-dialog").then(mod => ({ default: mod.CalendarDialog })), { ssr: false });
const SettingsDialog = dynamic(() => import("./settings-dialog").then(mod => ({ default: mod.SettingsDialog })), { ssr: false });
const AchievementsDialog = dynamic(() => import("./achievements-dialog").then(mod => ({ default: mod.AchievementsDialog })), { ssr: false });

interface DashboardLayoutClientProps {
    children: ReactNode;
    user: any;
    achievementsData: any[];
    allHouseholds: any[];
    allMembers: any[];
    allChores: any[];
    allRewards: any[];
}

export function DashboardLayoutClient({
    children,
    user,
    achievementsData,
    allHouseholds,
    allMembers,
    allChores,
    allRewards,
}: DashboardLayoutClientProps) {
    const searchParams = useSearchParams();
    const householdIdParam = searchParams.get("householdId");

    // Dialog states for bottom nav
    const [calendarOpen, setCalendarOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [achievementsOpen, setAchievementsOpen] = useState(false);

    // Determine current membership/household
    let membership = user.memberships[0];
    if (householdIdParam) {
        const found = user.memberships.find((m: any) => m.householdId === householdIdParam);
        if (found) {
            membership = found;
        }
    }

    const household = membership.household;

    // Filter members for the current household
    const currentHouseholdMembers = allMembers.filter(m => m.householdId === household.id);

    // Filter chores for the current household
    const householdChores = allChores.filter(c => c.householdId === household.id);

    // Filter rewards for the current household
    const rewards = allRewards.filter(r => r.householdId === household.id);

    return (
        <div className="min-h-screen bg-muted/30">
            <ChoreProvider
                initialChores={householdChores}
                userId={user.id}
                householdId={household.id}
                members={currentHouseholdMembers}
                userRole={membership.role}
            >
                <RewardProvider initialRewards={rewards} householdId={household.id}>
                    <div className="max-w-6xl mx-auto space-y-8 p-4 md:p-6 pb-20 md:pb-6">
                        <DashboardHeader
                            household={household}
                            user={user}
                            membership={membership}
                            achievementsData={achievementsData}
                            allHouseholds={allHouseholds}
                            members={currentHouseholdMembers}
                            householdChores={householdChores}
                        />
                        {children}
                    </div>

                    {/* Mobile Bottom Navigation */}
                    <MobileBottomNav
                        householdId={household.id}
                        onCalendarClick={() => setCalendarOpen(true)}
                        onSettingsClick={() => setSettingsOpen(true)}
                        onAchievementsClick={() => setAchievementsOpen(true)}
                    />

                    {/* Dialogs triggered by bottom nav */}
                    {calendarOpen && (
                        <CalendarDialog
                            userId={user.id}
                            open={calendarOpen}
                            onOpenChange={setCalendarOpen}
                        />
                    )}
                    {settingsOpen && (
                        <SettingsDialog
                            householdId={household.id}
                            currentMode={household.mode}
                            currentStrategy={household.assignmentStrategy}
                            allowMemberDelete={household.allowMemberDelete}
                            members={currentHouseholdMembers}
                            open={settingsOpen}
                            onOpenChange={setSettingsOpen}
                        />
                    )}
                    {achievementsOpen && (
                        <AchievementsDialog
                            achievements={achievementsData}
                            open={achievementsOpen}
                            onOpenChange={setAchievementsOpen}
                        />
                    )}
                </RewardProvider>
            </ChoreProvider>
        </div>
    );
}

