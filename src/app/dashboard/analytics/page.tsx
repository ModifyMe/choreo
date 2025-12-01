import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { AnalyticsCharts } from "./charts";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function AnalyticsPage() {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/api/auth/signin");
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user?.email! },
        include: { household: true },
    });

    if (!user?.householdId) {
        redirect("/onboarding");
    }

    // Fetch data for analytics
    // 1. Total chores completed by each member
    const members = await prisma.user.findMany({
        where: { householdId: user.householdId },
        select: {
            id: true,
            name: true,
            image: true,
            _count: {
                select: {
                    activityLogs: {
                        where: { action: "COMPLETED" }
                    }
                }
            }
        }
    });

    const choresByMember = members.map(m => ({
        name: m.name || "Unknown",
        completed: m._count.activityLogs,
        image: m.image
    })).sort((a, b) => b.completed - a.completed);

    // 2. Activity over the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const logs = await prisma.activityLog.findMany({
        where: {
            householdId: user.householdId,
            action: "COMPLETED",
            createdAt: {
                gte: sevenDaysAgo
            }
        },
        orderBy: { createdAt: 'asc' }
    });

    // Group logs by date
    const activityByDay: { [key: string]: number } = {};
    // Initialize last 7 days with 0
    for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toLocaleDateString('en-US', { weekday: 'short' });
        activityByDay[dateStr] = 0;
    }

    logs.forEach(log => {
        const dateStr = log.createdAt.toLocaleDateString('en-US', { weekday: 'short' });
        if (activityByDay[dateStr] !== undefined) {
            activityByDay[dateStr]++;
        }
    });

    const activityTrend = Object.entries(activityByDay).map(([name, count]) => ({
        name,
        count
    })).reverse(); // Show oldest to newest

    return (
        <div className="max-w-4xl mx-auto p-4 space-y-8 pb-20">
            <div className="flex items-center gap-4">
                <Link href="/dashboard">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Household Stats 📊</h1>
                    <p className="text-muted-foreground">See who's carrying the team!</p>
                </div>
            </div>

            <AnalyticsCharts
                choresByMember={choresByMember}
                activityTrend={activityTrend}
            />
        </div>
    );
}
