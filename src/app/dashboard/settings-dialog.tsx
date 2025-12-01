"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export function SettingsDialog({
    householdId,
    currentMode,
}: {
    householdId: string;
    currentMode: "STANDARD" | "ECONOMY";
}) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleModeChange = async (checked: boolean) => {
        setLoading(true);
        const newMode = checked ? "ECONOMY" : "STANDARD";

        try {
            const res = await fetch(`/api/households/${householdId}`, {
                method: "PATCH",
                body: JSON.stringify({ mode: newMode }),
            });

            if (!res.ok) throw new Error("Failed to update settings");

            toast.success(`Switched to ${newMode} mode`);
            router.refresh();
        } catch (error) {
            toast.error("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Settings className="w-5 h-5" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Household Settings</DialogTitle>
                    <DialogDescription>
                        Manage your household preferences.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="flex items-center justify-between space-x-2">
                        <div className="flex flex-col space-y-1">
                            <Label htmlFor="economy-mode" className="font-medium">
                                Economy Mode (Snack Limiting)
                            </Label>
                            <span className="text-xs text-muted-foreground">
                                Earn Gold for chores and spend it on rewards.
                            </span>
                        </div>
                        <Switch
                            id="economy-mode"
                            checked={currentMode === "ECONOMY"}
                            onCheckedChange={handleModeChange}
                            disabled={loading}
                        />
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
