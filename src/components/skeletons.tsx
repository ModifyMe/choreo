import { Skeleton } from "@/components/ui/skeleton";

export function ChoreCardSkeleton() {
    return (
        <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
            <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-1/3" />
                    <Skeleton className="h-4 w-12 rounded-full" />
                </div>
                <Skeleton className="h-4 w-2/3" />
                <div className="flex items-center gap-3 mt-2">
                    <Skeleton className="h-3 w-10" />
                    <Skeleton className="h-3 w-16" />
                </div>
            </div>
            <div className="ml-4">
                <Skeleton className="h-9 w-20" />
            </div>
        </div>
    );
}

export function LeaderboardSkeleton() {
    return (
        <div className="space-y-4">
            {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-6 w-6 rounded-full" />
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-8 w-8 rounded-full" />
                            <div>
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-3 w-16 mt-1" />
                            </div>
                        </div>
                    </div>
                    <Skeleton className="h-4 w-12" />
                </div>
            ))}
        </div>
    );
}

export function ActivityFeedSkeleton() {
    return (
        <div className="space-y-4 p-4">
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1 space-y-1">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-3 w-1/3" />
                    </div>
                </div>
            ))}
        </div>
    );
}
