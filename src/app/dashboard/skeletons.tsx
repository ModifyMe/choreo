import { Skeleton } from "@/components/ui/skeleton";

export function LeaderboardSkeleton() {
    return (
        <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-2">
                    <div className="flex items-center gap-3">
                        <Skeleton className="w-4 h-4" />
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-1">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-16" />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-8" />
                        <Skeleton className="h-4 w-4" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export function ActivityFeedSkeleton() {
    return (
        <div className="space-y-3 p-4">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-start gap-3">
                    <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                    <div className="flex-1 space-y-1">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-20" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export function ChoreListSkeleton() {
    return (
        <div className="space-y-3 p-4">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="p-4 border rounded-lg space-y-2">
                    <div className="flex justify-between">
                        <Skeleton className="h-5 w-40" />
                        <Skeleton className="h-5 w-12" />
                    </div>
                    <Skeleton className="h-4 w-28" />
                </div>
            ))}
        </div>
    );
}
