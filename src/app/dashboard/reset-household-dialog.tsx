"use client";

import { useRef, useState } from "react";
import { Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader,
    AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel,
} from "@/components/ui/alert-dialog";

export function ResetHouseholdDialog({ householdId, disabled }: { householdId: string; disabled?: boolean }) {
    const [open, setOpen] = useState(false);
    const [confirmation, setConfirmation] = useState("");
    const [loading, setLoading] = useState(false);
    const submitting = useRef(false);

    async function handleReset() {
        if (confirmation !== "RESET" || submitting.current) return;
        submitting.current = true;
        setLoading(true);
        try {
            const response = await fetch(`/api/households/${householdId}/reset`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ confirmation }),
            });
            if (!response.ok) throw new Error(await response.text());

            // Reload all household views, including client-side shopping/SWR state.
            window.location.assign(`/dashboard?householdId=${encodeURIComponent(householdId)}`);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to reset household");
            submitting.current = false;
            setLoading(false);
        }
    }

    return (
        <AlertDialog open={open} onOpenChange={(nextOpen) => {
            if (loading) return;
            setOpen(nextOpen);
            setConfirmation("");
        }}>
            <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full" disabled={disabled}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset Household
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Reset this household?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Permanently delete all chores, rewards, shopping items, activity, reactions and swaps
                        in this household, and reset every member to level 1 with 0 XP, 0 gold and no streak.
                        This cannot be undone. Members, settings, invite code and account-wide achievements are kept.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-2">
                    <Label htmlFor="reset-household-confirmation">Type RESET to confirm</Label>
                    <Input id="reset-household-confirmation" value={confirmation}
                        onChange={(event) => setConfirmation(event.target.value)}
                        disabled={loading} autoComplete="off" spellCheck={false} />
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
                    <Button variant="destructive" onClick={handleReset}
                        disabled={loading || confirmation !== "RESET"}>
                        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        {loading ? "Resetting…" : "Reset Household"}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
