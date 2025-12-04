"use client";

import { useSearchParams } from "next/navigation";
import { DashboardHeader } from "./dashboard-header";
import { ReactNode } from "react";
import { ChoreProvider } from "./chore-context";
import { RewardProvider } from "./reward-context";

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
        <div className="min-h-screen bg-muted/30 p-6">
            <ChoreProvider initialChores={householdChores} userId={user.id} householdId={household.id}>
                <RewardProvider initialRewards={rewards} householdId={household.id}>
                    <div className="max-w-6xl mx-auto space-y-8">
                        <DashboardHeader
                            household={household}
                            user={user}
                            membership={membership}
                            achievementsData={achievementsData}
                            allHouseholds={allHouseholds}
                            members={currentHouseholdMembers}
                        />
                        {children}
                    </div>
                </RewardProvider>
            </ChoreProvider>
        </div>
    );
}
