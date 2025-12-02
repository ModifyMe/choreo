"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle, Circle, Clock, Loader2, Upload, Camera, X, Bell, Lock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { runSideCannons } from "@/lib/confetti";
import { format, isPast, isToday, isTomorrow, isFuture } from "date-fns";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

interface Chore {
    id: string;
    title: string;
    description: string | null;
    points: number;
    assignedToId: string | null;
    status: string;
    dueDate: Date | null;
    recurrence: string | null;
}

export function ChoreList({ chores, userId, type }: { chores: Chore[]; userId: string; type: "my" | "available" }) {
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [selectedChoreId, setSelectedChoreId] = useState<string | null>(null);
    const [proofFile, setProofFile] = useState<File | null>(null);
    const router = useRouter();

    const handleAction = async (choreId: string, action: "CLAIM" | "COMPLETE", proofUrl?: string) => {
        setLoadingId(choreId);
        try {
            const res = await fetch(`/api/chores/${choreId}`, {
                method: "PATCH",
                body: JSON.stringify({ action, proofImage: proofUrl }),
            });

            if (!res.ok) {
                const error = await res.text();
                throw new Error(error);
            }

            toast.success(action === "CLAIM" ? "Chore claimed!" : "Chore completed! 🎉");
            if (action === "COMPLETE") {
                runSideCannons();
            }
            router.refresh();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Something went wrong");
        } finally {
            setLoadingId(null);
            setSelectedChoreId(null);
            setProofFile(null);
        }
    };

    const handleCompleteWithProof = async () => {
        if (!selectedChoreId) return;

        if (proofFile) {
            setUploading(true);
            try {
                // 1. Get Signed Upload Token from Server (Bypasses Vercel Limit)
                const fileExt = proofFile.name.split('.').pop();
                const fileName = `${Math.random()}.${fileExt}`;
                const filePath = `${userId}/${fileName}`;

                const tokenRes = await fetch("/api/upload", {
                    method: "POST",
                    body: JSON.stringify({ filePath }),
                    headers: { "Content-Type": "application/json" }
                });

                if (!tokenRes.ok) throw new Error("Failed to get upload token");
                const { token, path } = await tokenRes.json();

                // 2. Upload directly to Supabase using the token
                const { error: uploadError } = await supabase.storage
                    .from('chore-proofs')
                    .uploadToSignedUrl(path, token, proofFile);

                if (uploadError) throw uploadError;

                // 3. Get Public URL
                const { data } = supabase.storage.from('chore-proofs').getPublicUrl(path);
                proofUrl = data.publicUrl;
            } catch (error) {
                console.error("Upload failed", error);
                toast.error(`Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`);
            } finally {
                setUploading(false);
            }
        }

        await handleAction(selectedChoreId, "COMPLETE", proofUrl);
    };

    if (chores.length === 0) {
        return <div className="text-muted-foreground text-sm italic">No chores found.</div>;
    }

    return (
        <div className="space-y-4">
            {chores.map((chore) => {
                const isOverdue = chore.dueDate && isPast(new Date(chore.dueDate)) && !isToday(new Date(chore.dueDate));

                return (
                    <div key={chore.id} className={`flex items-center justify-between p-4 border rounded-lg bg-card ${isOverdue ? "border-red-300 bg-red-50 dark:bg-red-950/20" : ""}`}>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <h3 className="font-medium">{chore.title}</h3>
                                {chore.recurrence && chore.recurrence !== "NONE" && (
                                    <span className="text-[10px] uppercase bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-bold">
                                        {chore.recurrence}
                                    </span>
                                )}
                            </div>
                            {chore.description && <p className="text-sm text-muted-foreground">{chore.description}</p>}
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span className="font-semibold text-primary">{chore.points} pts</span>
                                {chore.dueDate && (
                                    <span className={`flex items-center gap-1 ${isOverdue ? "text-red-600 font-bold" : ""}`}>
                                        <Clock className="w-3 h-3" />
                                        {isToday(new Date(chore.dueDate)) ? "Today" :
                                            isTomorrow(new Date(chore.dueDate)) ? "Tomorrow" :
                                                format(new Date(chore.dueDate), "MMM d")}
                                    </span>
                                )}
                            </div>
                        </div>

                        {type === "available" ? (
                            <Button
                                size="sm"
                                onClick={() => handleAction(chore.id, "CLAIM")}
                                disabled={loadingId === chore.id}
                            >
                                {loadingId === chore.id ? <Loader2 className="w-4 h-4 animate-spin" /> : "Claim"}
                            </Button>
                        ) : (
                            <div className="flex gap-2">
                                {chore.assignedToId && chore.assignedToId !== userId && (
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={async () => {
                                            toast.promise(
                                                fetch(`/api/chores/${chore.id}/nudge`, { method: "POST" }),
                                                {
                                                    loading: 'Nudging...',
                                                    success: 'Nudge sent! 🔔',
                                                    error: 'Failed to send nudge'
                                                }
                                            );
                                        }}
                                        title="Nudge Assignee"
                                    >
                                        <Bell className="w-4 h-4 text-muted-foreground" />
                                    </Button>
                                )}

                                {isFuture(new Date(chore.dueDate || 0)) && !isToday(new Date(chore.dueDate || 0)) ? (
                                    <Button size="sm" variant="secondary" disabled className="opacity-50 cursor-not-allowed">
                                        <Lock className="w-4 h-4 mr-2" />
                                        Locked
                                    </Button>
                                ) : (
                                    <Dialog open={selectedChoreId === chore.id} onOpenChange={(open) => !open && setSelectedChoreId(null)}>
                                        <DialogTrigger asChild>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="gap-2"
                                                onClick={() => setSelectedChoreId(chore.id)}
                                            >
                                                <CheckCircle className="w-4 h-4 text-green-500" />
                                                Complete
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-md">
                                            <DialogHeader>
                                                <DialogTitle>Complete "{chore.title}"</DialogTitle>
                                                <DialogDescription>
                                                    Upload a photo proof (optional) to complete this chore.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="grid w-full gap-4 py-4">
                                                <div className="flex flex-col gap-2">
                                                    <Label htmlFor="picture" className="text-sm font-medium">Proof Photo</Label>
                                                    <input
                                                        id="picture"
                                                        type="file"
                                                        accept="image/*"
                                                        capture="environment"
                                                        className="hidden"
                                                        ref={(input) => {
                                                            if (input) input.onclick = (e) => { (e.target as HTMLInputElement).value = '' }
                                                        }}
                                                        onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                                                    />

                                                    {proofFile ? (
                                                        <div className="relative group">
                                                            <img
                                                                src={URL.createObjectURL(proofFile)}
                                                                alt="Proof preview"
                                                                className="w-full h-64 object-cover rounded-lg border shadow-sm"
                                                            />
                                                            <Button
                                                                variant="destructive"
                                                                size="icon"
                                                                className="absolute top-2 right-2 h-8 w-8 opacity-90 hover:opacity-100 transition-opacity"
                                                                onClick={() => setProofFile(null)}
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            className="h-40 w-full border-dashed border-2 flex flex-col gap-3 hover:bg-muted/50 transition-colors"
                                                            onClick={() => document.getElementById('picture')?.click()}
                                                        >
                                                            <div className="p-3 bg-background rounded-full shadow-sm">
                                                                <Camera className="w-6 h-6 text-primary" />
                                                            </div>
                                                            <div className="flex flex-col items-center gap-1">
                                                                <span className="font-medium">Tap to Take Photo</span>
                                                                <span className="text-xs text-muted-foreground">or upload from gallery</span>
                                                            </div>
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                            <DialogFooter className="sm:justify-between gap-2">
                                                <Button variant="ghost" onClick={() => setSelectedChoreId(null)}>Cancel</Button>
                                                <Button onClick={handleCompleteWithProof} disabled={uploading || loadingId === chore.id} className="w-full sm:w-auto">
                                                    {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                                                    {uploading ? "Uploading..." : "Complete Chore"}
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                )}
                            </div>
                        )}
                    </div >
                );
            })}
        </div >
    );
}
