"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { ArrowLeftRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useChores, Chore } from "./chore-context";
import { useRouter } from "next/navigation";

interface PostSwapDialogProps {
    chore: Chore;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function PostSwapDialog({ chore, open, onOpenChange }: PostSwapDialogProps) {
    const { householdChores } = useChores();
    const [wantedDescription, setWantedDescription] = useState("");
    const [wantedChoreId, setWantedChoreId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async () => {
        if (!wantedDescription.trim()) {
            toast.error("Please describe what you want in return");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/swaps", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    offeredChoreId: chore.id,
                    wantedDescription: wantedDescription.trim(),
                    wantedChoreId: wantedChoreId || undefined,
                }),
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || "Failed to post swap");
            }

            toast.success("Swap offer posted!");
            onOpenChange(false);
            setWantedDescription("");
            setWantedChoreId(null);
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || "Failed to post swap offer");
        } finally {
            setLoading(false);
        }
    };

    const hasReachedLimit = (chore.swapOfferCount ?? 0) >= 2;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[calc(100vw-2rem)] max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ArrowLeftRight className="h-5 w-5" />
                        Post Swap Offer
                    </DialogTitle>
                    <DialogDescription>
                        Offer "{chore.title}" for trade on the swap board.
                    </DialogDescription>
                </DialogHeader>

                {hasReachedLimit ? (
                    <div className="py-6 text-center">
                        <p className="text-muted-foreground">
                            This chore has already been posted to the swap board twice.
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
                            Each chore can only be offered for swap up to 2 times.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4 pt-4">
                        {/* What you're offering */}
                        <div className="p-3 bg-muted/50 rounded-md">
                            <p className="text-xs text-muted-foreground mb-1">You're offering:</p>
                            <p className="font-medium">{chore.title}</p>
                            <p className="text-sm text-muted-foreground">{chore.points} XP</p>
                        </div>

                        {/* What you want */}
                        <div className="space-y-2">
                            <Label htmlFor="wanted">What do you want in return?</Label>
                            <Textarea
                                id="wanted"
                                placeholder="e.g., I'll do your dishes tomorrow..."
                                value={wantedDescription}
                                onChange={(e) => setWantedDescription(e.target.value)}
                                className="min-h-[80px]"
                            />
                        </div>

                        {/* Optional: specific chore */}
                        {householdChores.length > 0 && (
                            <div className="space-y-2">
                                <Label>Or request a specific chore (optional)</Label>
                                <Select
                                    value={wantedChoreId || "none"}
                                    onValueChange={(v) => setWantedChoreId(v === "none" ? null : v)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a chore..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">No specific chore</SelectItem>
                                        {householdChores.map((c) => (
                                            <SelectItem key={c.id} value={c.id}>
                                                {c.title} ({c.assignedTo?.name || "Unassigned"})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {/* Swap count warning */}
                        {chore.swapOfferCount === 1 && (
                            <p className="text-xs text-amber-600">
                                ⚠️ This is your last swap attempt for this chore.
                            </p>
                        )}

                        <Button
                            onClick={handleSubmit}
                            disabled={loading || !wantedDescription.trim()}
                            className="w-full"
                        >
                            {loading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <>
                                    <ArrowLeftRight className="h-4 w-4 mr-2" />
                                    Post to Swap Board
                                </>
                            )}
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
