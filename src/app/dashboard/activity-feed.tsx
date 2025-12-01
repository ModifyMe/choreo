"use client";

import { CardContent } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { CheckCircle2, Plus, ShoppingBag, UserPlus } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface ActivityLog {
    id: string;
    action: string;
    createdAt: Date;
    proofImage?: string | null;
    user: {
        name: string | null;
    };
    chore: {
        title: string;
    } | null;
}

export function ActivityFeed({ logs }: { logs: ActivityLog[] }) {
    const getIcon = (action: string) => {
        switch (action) {
            case "CREATED":
                return <Plus className="w-4 h-4 text-blue-500" />;
            case "COMPLETED":
                return <CheckCircle2 className="w-4 h-4 text-green-500" />;
            case "CLAIMED":
                return <UserPlus className="w-4 h-4 text-purple-500" />;
            case "REDEEMED":
                return <ShoppingBag className="w-4 h-4 text-yellow-500" />;
            default:
                return <Plus className="w-4 h-4 text-gray-500" />;
        }
    };

    const getMessage = (log: ActivityLog) => {
        const userName = log.user.name || "Someone";
        const choreTitle = log.chore?.title || "a chore";

        switch (log.action) {
            case "CREATED":
                return (
                    <span>
                        <span className="font-medium">{userName}</span> added{" "}
                        <span className="font-medium">{choreTitle}</span>
                    </span>
                );
            case "COMPLETED":
                return (
                    <span>
                        <span className="font-medium">{userName}</span> completed{" "}
                        <span className="font-medium">{choreTitle}</span>
                    </span>
                );
            case "CLAIMED":
                return (
                    <span>
                        <span className="font-medium">{userName}</span> claimed{" "}
                        <span className="font-medium">{choreTitle}</span>
                    </span>
                );
            case "REDEEMED":
                return (
                    <span>
                        <span className="font-medium">{userName}</span> redeemed a reward
                    </span>
                );
            default:
                return <span>{userName} performed an action</span>;
        }
    };

    return (
        <CardContent className="space-y-4">
            {logs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recent activity.</p>
            ) : (
                logs.map((log) => (
                    <div key={log.id} className="flex items-start gap-3 text-sm border-b pb-3 last:border-0">
                        <div className="mt-0.5">{getIcon(log.action)}</div>
                        <div className="flex-1 space-y-1">
                            <p className="leading-none">{getMessage(log)}</p>
                            <p className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                            </p>
                            {log.proofImage && (
                                <div className="mt-2">
                                    <a href={log.proofImage} target="_blank" rel="noopener noreferrer">
                                        <img
                                            src={log.proofImage}
                                            alt="Proof"
                                            className="w-24 h-24 object-cover rounded-md border hover:opacity-90 transition-opacity"
                                        />
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                ))
            )}
        </CardContent>
    );
}
