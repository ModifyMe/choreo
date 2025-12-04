"use client";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Plane } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";

export function VacationToggle({
    householdId,
    initialIsAway,
    minimal = false,
}: {
    householdId: string;
    initialIsAway: boolean;
    minimal?: boolean;
}) {
    const [isAway, setIsAway] = useState(initialIsAway);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleToggle = async (checked: boolean) => {
        setIsAway(checked);
        setLoading(true);
        try {
            const res = await fetch("/api/memberships/status", {
                method: "PATCH",
                body: JSON.stringify({ householdId, isAway: checked }),
            });

            if (!res.ok) throw new Error("Failed to update status");

            toast.success(checked ? "Vacation mode ON 🌴" : "Welcome back! 👋");
            router.refresh();
        } catch (error) {
            setIsAway(!checked); // Revert
            toast.error("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    if (minimal) {
        return (
            <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                    <Plane className={`h-4 w-4 ${isAway ? "text-blue-500" : "text-muted-foreground"}`} />
                    <span className="text-sm font-medium">Vacation Mode</span>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                                <p className="max-w-[200px]">When on vacation, you won't be assigned new recurring chores.</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
                <Switch
                    checked={isAway}
                    onCheckedChange={handleToggle}
                    disabled={loading}
                />
            </div>
        );
    }

    return (
        <div className="flex items-center space-x-2 border p-2 rounded-md bg-background">
            <Plane className={`h-4 w-4 ${isAway ? "text-blue-500" : "text-muted-foreground"}`} />
            <div className="flex items-center gap-2">
                <Label htmlFor="vacation-mode" className="text-sm font-medium cursor-pointer">
                    Vacation Mode
                </Label>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                            <p className="max-w-[200px]">When on vacation, you won't be assigned new recurring chores.</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
            <Switch
                id="vacation-mode"
                checked={isAway}
                onCheckedChange={handleToggle}
                disabled={loading}
            />
        </div>
    );
}
