"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle, Circle, Clock, Loader2, Upload, Camera, X, Bell } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { runSideCannons } from "@/lib/confetti";
import { format, isPast, isToday, isTomorrow } from "date-fns";
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

        let proofUrl = undefined;

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
                                            id="picture"
                                            type="file"
                                            accept="image/*"
                                            capture="environment"
                                            className="hidden"
                                            ref={(input) => {
                                                // Auto-focus or just keep ref if needed, but we use ID for label or click handler
                                                if (input) input.onclick = (e) => { (e.target as HTMLInputElement).value = '' } // Reset to allow same file selection
                                            }}
                                            onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                                        />

                                        {proofFile ? (
                                            <div className="relative mt-2">
                                                <img
                                                    src={URL.createObjectURL(proofFile)}
                                                    alt="Proof preview"
                                                    className="w-full h-48 object-cover rounded-md border"
                                                />
                                                <Button
                                                    variant="destructive"
                                                    size="icon"
                                                    className="absolute top-2 right-2 h-8 w-8"
                                                    onClick={() => setProofFile(null)}
                                                >
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="h-32 border-dashed flex flex-col gap-2 mt-2 hover:bg-muted/50"
                                                onClick={() => document.getElementById('picture')?.click()}
                                            >
                                                <Camera className="w-8 h-8 text-muted-foreground" />
                                                <span className="text-muted-foreground">Tap to Take Photo</span>
                                            </Button>
                                        )}
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setSelectedChoreId(null)}>Cancel</Button>
                                        <Button onClick={handleCompleteWithProof} disabled={uploading || loadingId === chore.id}>
                                            {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                            {uploading ? "Uploading..." : "Complete Chore"}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog >
                        )
}
                    </div >
                );
            })}
        </div >
    );
}
