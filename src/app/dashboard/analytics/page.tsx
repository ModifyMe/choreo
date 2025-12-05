import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";

// Lazy load recharts bundle (~200KB) - only loads when analytics page is visited
const AnalyticsCharts = dynamic(() => import("./charts").then(mod => ({ default: mod.AnalyticsCharts })), {
    loading: () => (
        <div className="grid gap-6 md:grid-cols-2">
            <div className="col-span-2 md:col-span-1 h-[400px] rounded-lg border bg-card flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
            <div className="col-span-2 md:col-span-1 h-[400px] rounded-lg border bg-card flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        </div>
    ),
    ssr: false
});

export default async function AnalyticsPage() {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/api/auth/signin");
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user?.email! },
        include: {
            memberships: {
                include: {
                    household: true
                }
            }
        },
    });

    const membership = user?.memberships[0];
    const householdId = membership?.householdId;

    if (!householdId) {
        redirect("/onboarding");
    }

    // Fetch data for analytics
    // Fetch data for analytics in parallel
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [members, logs] = await Promise.all([
        // 1. Total chores completed by each member
        prisma.user.findMany({
            where: {
                memberships: {
                    some: {
                        householdId: householdId
                    }
                }
            },
            select: {
                id: true,
                name: true,
                image: true,
                _count: {
                    select: {
                        activityLogs: {
                            where: {
                                action: "COMPLETED",
                                householdId: householdId
                            }
                        }
                    }
                }
            }
        }),
        // 2. Activity over the last 7 days
        prisma.activityLog.findMany({
            where: {
                householdId: householdId,
                action: "COMPLETED",
                createdAt: {
                    gte: sevenDaysAgo
                }
            },
            orderBy: { createdAt: 'asc' }
        })
    ]);

    const choresByMember = members.map(m => ({
        name: m.name || "Unknown",
        completed: m._count.activityLogs,
        image: m.image
    })).sort((a, b) => b.completed - a.completed);

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
