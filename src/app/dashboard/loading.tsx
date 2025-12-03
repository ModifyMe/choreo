import { Skeleton } from "@/components/ui/skeleton";
import { ChoreCardSkeleton, LeaderboardSkeleton, ActivityFeedSkeleton } from "@/components/skeletons";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function DashboardLoading() {
    return (
        <div className="min-h-screen bg-muted/30 p-6">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header Skeleton */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <Skeleton className="h-9 w-48 mb-2" />
                        <div className="flex gap-2">
                            <Skeleton className="h-5 w-24" />
                            <Skeleton className="h-5 w-24" />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Skeleton className="h-10 w-10" />
                        <Skeleton className="h-10 w-10" />
                        <Skeleton className="h-10 w-10" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Main Content Area - Chores */}
                    <div className="md:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>My Chores</CardTitle>
                            </CardHeader>
                            <div className="p-6 space-y-4">
                                <ChoreCardSkeleton />
                                <ChoreCardSkeleton />
                                <ChoreCardSkeleton />
                            </div>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Available Chores</CardTitle>
                            </CardHeader>
                            <div className="p-6 space-y-4">
                                <ChoreCardSkeleton />
                                <ChoreCardSkeleton />
                            </div>
                        </Card>
                    </div>

                    {/* Sidebar - Leaderboard & Activity */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Leaderboard</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <LeaderboardSkeleton />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Recent Activity</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <ActivityFeedSkeleton />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
