"use client";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Plane } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function VacationToggle({
    householdId,
    initialIsAway,
}: {
    householdId: string;
    initialIsAway: boolean;
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

    return (
        <div className="flex items-center space-x-2 border p-2 rounded-md bg-background">
            <Plane className={`h-4 w-4 ${isAway ? "text-blue-500" : "text-muted-foreground"}`} />
            <Label htmlFor="vacation-mode" className="text-sm font-medium cursor-pointer">
                Vacation Mode
            </Label>
            <Switch
                id="vacation-mode"
                checked={isAway}
                onCheckedChange={handleToggle}
                disabled={loading}
            />
        </div>
    );
}
