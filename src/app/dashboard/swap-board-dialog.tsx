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
import { useState, useEffect, useCallback } from "react";
import { ArrowLeftRight, Clock, User, ChevronRight, Loader2, AlertCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";

interface SwapOffer {
    id: string;
    wantedDescription: string;
    expiresAt: string;
    createdAt: string;
    status: string;
    offeredChore: {
        id: string;
        title: string;
        points: number;
        dueDate: string | null;
        priority: string;
    };
    wantedChore: {
        id: string;
        title: string;
        points: number;
        assignedTo: { name: string; image: string | null } | null;
    } | null;
    createdBy: {
        id: string;
        name: string;
        image: string | null;
    };
}

export function SwapBoardDialog({
    householdId,
    userId,
    open: controlledOpen,
    onOpenChange: controlledOnOpenChange
}: {
    householdId: string;
    userId: string;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}) {
    const [internalOpen, setInternalOpen] = useState(false);
    const [swapOffers, setSwapOffers] = useState<SwapOffer[]>([]);
    const [loading, setLoading] = useState(true);
    const [acceptingId, setAcceptingId] = useState<string | null>(null);
    const router = useRouter();

    // Support both controlled and uncontrolled modes
    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : internalOpen;
    const setOpen = isControlled ? controlledOnOpenChange! : setInternalOpen;

    const fetchSwapOffers = useCallback(async () => {
        try {
            const res = await fetch(`/api/swaps?householdId=${householdId}`);
            if (!res.ok) throw new Error("Failed to fetch");
            const data = await res.json();
            setSwapOffers(data);
        } catch (error) {
            console.error("Failed to fetch swap offers:", error);
        } finally {
            setLoading(false);
        }
    }, [householdId]);

    useEffect(() => {
        if (open) {
            setLoading(true);
            fetchSwapOffers();
        }
    }, [open, fetchSwapOffers]);

    const handleAccept = async (swapId: string) => {
        setAcceptingId(swapId);
        try {
            const res = await fetch(`/api/swaps/${swapId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "ACCEPT" }),
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || "Failed to accept swap");
            }

            toast.success("Swap accepted! Chores have been traded.");
            fetchSwapOffers();
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || "Failed to accept swap");
        } finally {
            setAcceptingId(null);
        }
    };

    const handleCancel = async (swapId: string) => {
        try {
            const res = await fetch(`/api/swaps/${swapId}`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error("Failed to cancel");

            toast.success("Swap offer cancelled");
            fetchSwapOffers();
        } catch (error) {
            toast.error("Failed to cancel swap offer");
        }
    };

    const getTimeRemaining = (expiresAt: string) => {
        const expires = new Date(expiresAt);
        const now = new Date();
        const diff = expires.getTime() - now.getTime();
        if (diff <= 0) return "Expired";
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {!isControlled && (
                <DialogTrigger asChild>
                    <Button variant="outline" size="icon" title="Swap Board">
                        <ArrowLeftRight className="h-4 w-4" />
                    </Button>
                </DialogTrigger>
            )}
            <DialogContent className="w-[calc(100vw-2rem)] max-w-[500px] max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ArrowLeftRight className="h-5 w-5" />
                        Swap Board
                    </DialogTitle>
                    <DialogDescription>
                        Trade chores with your housemates. Accept an offer or post your own!
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : swapOffers.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <ArrowLeftRight className="h-12 w-12 mx-auto mb-3 opacity-30" />
                            <p className="font-medium">No active swap offers</p>
                            <p className="text-sm mt-1">
                                Post a swap from your chore card to get started!
                            </p>
                        </div>
                    ) : (
                        swapOffers.map((swap) => {
                            const isOwn = swap.createdBy.id === userId;
                            const timeRemaining = getTimeRemaining(swap.expiresAt);

                            return (
                                <div
                                    key={swap.id}
                                    className={cn(
                                        "border rounded-lg p-4 space-y-3",
                                        isOwn && "bg-muted/30 border-primary/30"
                                    )}
                                >
                                    {/* Header */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={swap.createdBy.image || undefined} />
                                                <AvatarFallback>{swap.createdBy.name?.[0] || "?"}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="text-sm font-medium">
                                                    {isOwn ? "Your offer" : swap.createdBy.name}
                                                </p>
                                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {timeRemaining} left
                                                </p>
                                            </div>
                                        </div>
                                        {isOwn && (
                                            <Badge variant="outline" className="text-xs">
                                                Your Offer
                                            </Badge>
                                        )}
                                    </div>

                                    {/* Swap Details */}
                                    <div className="bg-background rounded-md p-3 space-y-2">
                                        {/* Offered Chore */}
                                        <div className="flex items-center gap-2">
                                            <div className="w-16 text-xs text-muted-foreground">Offering:</div>
                                            <div className="flex-1">
                                                <p className="font-medium text-sm">{swap.offeredChore.title}</p>
                                                <p className="text-xs text-muted-foreground">{swap.offeredChore.points} XP</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-center">
                                            <ChevronRight className="h-4 w-4 text-muted-foreground rotate-90" />
                                        </div>

                                        {/* Wanted */}
                                        <div className="flex items-start gap-2">
                                            <div className="w-16 text-xs text-muted-foreground">Wants:</div>
                                            <div className="flex-1">
                                                <p className="text-sm">{swap.wantedDescription}</p>
                                                {swap.wantedChore && (
                                                    <Badge variant="secondary" className="mt-1 text-xs">
                                                        {swap.wantedChore.title} ({swap.wantedChore.assignedTo?.name})
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2">
                                        {isOwn ? (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1"
                                                onClick={() => handleCancel(swap.id)}
                                            >
                                                Cancel Offer
                                            </Button>
                                        ) : (
                                            <>
                                                <Button
                                                    size="sm"
                                                    className="flex-1"
                                                    onClick={() => handleAccept(swap.id)}
                                                    disabled={acceptingId === swap.id}
                                                >
                                                    {acceptingId === swap.id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        "Accept Swap"
                                                    )}
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
