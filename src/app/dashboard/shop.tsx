"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Coins, ShoppingBag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { runConfetti } from "@/lib/confetti";

interface Reward {
    id: string;
    name: string;
    cost: number;
    stock: number | null;
}

import { useRewards } from "./reward-context";

export function Shop({
    userBalance,
    isAdmin,
}: {
    userBalance: number;
    isAdmin: boolean;
}) {
    const router = useRouter();
    const { rewards, redeemReward, deleteReward } = useRewards();
    const [loadingId, setLoadingId] = useState<string | null>(null);

    const handleRedeem = async (rewardId: string) => {
        setLoadingId(rewardId);

        // Optimistic update handled by context (if we implemented it fully there)
        // For now, we rely on the fast server response + realtime, 
        // but we can call redeemReward(rewardId) if we want to decrement stock optimistically.
        redeemReward(rewardId);

        try {
            const res = await fetch(`/api/rewards/${rewardId}`, {
                method: "PATCH",
                body: JSON.stringify({ action: "REDEEM" }),
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(text);
            }

            runConfetti();
            toast.success("Reward redeemed! Enjoy.");
            // router.refresh(); // No longer needed for rewards list, but maybe for balance?
            // Balance is on membership, which is passed from page.tsx (server component).
            // So we DO need router.refresh() to update the balance in the UI!
            router.refresh();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to redeem");
        } finally {
            setLoadingId(null);
        }
    };

    const handleDelete = async (rewardId: string) => {
        if (!confirm("Are you sure you want to delete this reward?")) return;
        setLoadingId(rewardId);

        // Optimistic delete
        deleteReward(rewardId);

        try {
            const res = await fetch(`/api/rewards/${rewardId}`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error("Failed to delete");

            toast.success("Reward deleted");
            // router.refresh(); // Not needed for list, but good for consistency
        } catch (error) {
            toast.error("Failed to delete reward");
        } finally {
            setLoadingId(null);
        }
    };

    if (rewards.length === 0) {
        return (
            <div className="text-center p-8 text-muted-foreground">
                <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No rewards available yet.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rewards.map((reward) => (
                <Card key={reward.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                            <CardTitle className="text-lg">{reward.name}</CardTitle>
                            <div className="flex items-center text-yellow-600 font-bold">
                                <Coins className="w-4 h-4 mr-1" />
                                {reward.cost}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex justify-between items-center mt-2">
                            <div className="text-sm text-muted-foreground">
                                {reward.stock !== null ? `${reward.stock} left` : "Unlimited"}
                            </div>
                            <div className="flex gap-2">
                                {isAdmin && (
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 text-destructive hover:text-destructive"
                                        onClick={() => handleDelete(reward.id)}
                                        disabled={loadingId === reward.id}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                )}
                                <Button
                                    size="sm"
                                    onClick={() => handleRedeem(reward.id)}
                                    disabled={loadingId === reward.id || userBalance < reward.cost || (reward.stock !== null && reward.stock <= 0)}
                                >
                                    Buy
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
