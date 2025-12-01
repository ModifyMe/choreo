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

export function Shop({
    rewards,
    userBalance,
    isAdmin,
}: {
    rewards: Reward[];
    userBalance: number;
    isAdmin: boolean;
}) {
    const router = useRouter();
    const [loadingId, setLoadingId] = useState<string | null>(null);

    const handleRedeem = async (rewardId: string) => {
        setLoadingId(rewardId);
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
        try {
            const res = await fetch(`/api/rewards/${rewardId}`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error("Failed to delete");

            toast.success("Reward deleted");
            router.refresh();
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
