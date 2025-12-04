"use client";

import { useSearchParams } from "next/navigation";
import { DashboardHeader } from "./dashboard-header";
import { ReactNode } from "react";

interface DashboardLayoutClientProps {
    children: ReactNode;
    user: any;
    achievementsData: any[];
    allHouseholds: any[];
    allMembers: any[]; // Flat list of all members from all user's households
}

export function DashboardLayoutClient({
    children,
    user,
    achievementsData,
    allHouseholds,
    allMembers,
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

    return (
        <div className="min-h-screen bg-muted/30 p-6">
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
        </div>
    );
}
