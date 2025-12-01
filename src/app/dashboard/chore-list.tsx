"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle, Circle, Clock, Loader2, Upload } from "lucide-react";
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
                const formData = new FormData();
                formData.append("file", proofFile);

                const uploadRes = await fetch("/api/upload", {
                    method: "POST",
                    body: formData,
                });

                if (!uploadRes.ok) {
                    const errorText = await uploadRes.text();
                    throw new Error(errorText || "Upload failed");
                }

                const data = await uploadRes.json();
                proofUrl = data.url;
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
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Complete "{chore.title}"</DialogTitle>
                                        <DialogDescription>
                                            Upload a photo proof (optional) to complete this chore.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid w-full max-w-sm items-center gap-1.5">
                                        <Label htmlFor="picture">Picture</Label>
                                        <Input id="picture" type="file" accept="image/*" onChange={(e) => setProofFile(e.target.files?.[0] || null)} />
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setSelectedChoreId(null)}>Cancel</Button>
                                        <Button onClick={handleCompleteWithProof} disabled={uploading || loadingId === chore.id}>
                                            {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                            {uploading ? "Uploading..." : "Complete Chore"}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
