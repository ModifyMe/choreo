import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingCart } from "lucide-react";

export default function Loading() {
    return (
        <Card className="max-w-2xl mx-auto">
            <CardHeader className="flex flex-row items-center gap-2">
                <Skeleton className="h-8 w-8 rounded" />
                <ShoppingCart className="w-5 h-5 text-muted-foreground" />
                <span className="text-lg font-semibold">Shopping List</span>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Input skeleton */}
                <div className="flex gap-2">
                    <Skeleton className="h-10 flex-1" />
                    <Skeleton className="h-10 w-20" />
                </div>

                {/* Items skeleton */}
                <div className="space-y-2">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
                            <Skeleton className="h-5 w-5 rounded" />
                            <div className="flex-1 space-y-1">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-3 w-20" />
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
