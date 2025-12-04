"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { useRewards } from "./reward-context";

export function AddRewardDialog({ householdId }: { householdId: string }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { addReward, removeOptimisticReward } = useRewards();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const name = formData.get("name") as string;
        const cost = formData.get("cost") as string;

        // Optimistic Add
        const tempId = Math.random().toString(36).substring(7);
        const optimisticReward = {
            id: tempId,
            name,
            cost: parseInt(cost),
            stock: null, // Default to unlimited for now
            householdId,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        addReward(optimisticReward);
        setOpen(false);
        toast.success("Reward added to shop");

        try {
            const res = await fetch("/api/rewards", {
                method: "POST",
                body: JSON.stringify({
                    name,
                    cost,
                    householdId,
                }),
            });

            if (!res.ok) throw new Error("Failed to create reward");

            // Success! The real reward will come via Realtime.
            // We don't need to manually remove the optimistic one here because 
            // the context handles deduplication/cleanup when the real one arrives.
            // However, we should remove it if there's an error.

            // Real-time subscription handles new rewards
        } catch (error) {
            toast.error("Something went wrong");
            // Revert optimistic add on error
            removeOptimisticReward(tempId);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Reward
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add New Reward</DialogTitle>
                    <DialogDescription>
                        Create a reward that members can buy with Gold.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                                Name
                            </Label>
                            <Input
                                id="name"
                                name="name"
                                placeholder="e.g. Chocolate Bar"
                                className="col-span-3"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="cost" className="text-right">
                                Cost (Gold)
                            </Label>
                            <Input
                                id="cost"
                                name="cost"
                                type="number"
                                placeholder="50"
                                className="col-span-3"
                                required
                                min="1"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Adding..." : "Add Reward"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
