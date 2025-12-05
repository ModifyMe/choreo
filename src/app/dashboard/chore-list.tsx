"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle, Circle, Clock, Loader2, Upload, Camera, X, Bell, Lock, MoreVertical, Pencil, Trash2 } from "lucide-react";
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import dynamic from "next/dynamic";
import { useChores, Chore } from "./chore-context";
import { ChoreCard } from "./chore-card";
import imageCompression from "browser-image-compression";

// Lazy load heavy dialog component
const EditChoreDialog = dynamic(() => import("./edit-chore-dialog").then(mod => mod.EditChoreDialog), {
    ssr: false,
});

export function ChoreList({ userId, type }: { userId: string; type: "my" | "available" }) {
    const { myChores, availableChores, moveChoreToMy, completeChore, deleteChore, restoreChore, toggleSubtask, updateChore } = useChores();
    const chores = type === "my" ? myChores : availableChores;

    const [loadingId, setLoadingId] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [selectedChoreId, setSelectedChoreId] = useState<string | null>(null);
    const [proofFile, setProofFile] = useState<File | null>(null);

    // Edit & Delete State
    const [editingChore, setEditingChore] = useState<Chore | null>(null);
    const [deletingChoreId, setDeletingChoreId] = useState<string | null>(null);

    const router = useRouter();

    const handleAction = async (choreId: string, action: "CLAIM" | "COMPLETE", proofUrl?: string) => {
        setLoadingId(choreId);

        // Optimistic Updates
        if (action === "CLAIM") {
            moveChoreToMy(choreId, userId);
            toast.success("Chore claimed!");
        } else if (action === "COMPLETE") {
            completeChore(choreId);
            toast.success("Chore completed! 🎉");
            runSideCannons();
        }

        try {
            const res = await fetch(`/api/chores/${choreId}`, {
                method: "PATCH",
                body: JSON.stringify({ action, proofImage: proofUrl }),
            });

            if (!res.ok) {
                const error = await res.text();
                throw new Error(error);
            }

            // No need to refresh, real-time subscription will handle it
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Something went wrong");

            // Revert optimistic update
            if (action === "COMPLETE") {
                updateChore(choreId, { status: "PENDING" });
            }
            // Real-time subscription will sync state on error recovery
        } finally {
            setLoadingId(null);
            setSelectedChoreId(null);
            setProofFile(null);
        }
    };

    const handleDelete = async () => {
        if (!deletingChoreId) return;
        setLoadingId(deletingChoreId);

        // Optimistic Delete
        deleteChore(deletingChoreId);
        toast.success("Chore deleted");

        try {
            const res = await fetch(`/api/chores/${deletingChoreId}`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error("Failed to delete chore");

            // No need to refresh, real-time subscription will handle it
        } catch (error) {
            toast.error("Failed to delete chore");
            restoreChore(deletingChoreId); // Restore on error
            // router.refresh(); // Optional: keep if you want to force sync on error
        } finally {
            setLoadingId(null);
            setDeletingChoreId(null);
        }
    };

    const handleCompleteWithProof = async () => {
        if (!selectedChoreId) return;

        let proofUrl = undefined;

        if (proofFile) {
            setUploading(true);
            try {
                // Compress image
                const options = {
                    maxSizeMB: 0.5, // Compress to ~500KB
                    maxWidthOrHeight: 1024,
                    useWebWorker: true,
                };

                let compressedFile = proofFile;
                try {
                    compressedFile = await imageCompression(proofFile, options);
                } catch (error) {
                    console.error("Compression failed, using original file", error);
                }

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
                    .uploadToSignedUrl(path, token, compressedFile);

                if (uploadError) throw uploadError;

                // 3. Get Public URL
                const { data } = supabase.storage.from('chore-proofs').getPublicUrl(path);
                proofUrl = data.publicUrl;
            } catch (error) {
                console.error("Upload failed", error);
                toast.error(`Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`);
                setUploading(false);
                return; // Stop if upload fails
            }
        }

        await handleAction(selectedChoreId, "COMPLETE", proofUrl);
        setUploading(false);
    };

    return (
        <>
            {chores.length === 0 ? (
                <div className="text-muted-foreground text-sm italic text-center py-12 border rounded-lg border-dashed">No chores found.</div>
            ) : (
                <div className="space-y-4">
                    {chores.map((chore) => (
                        <ChoreCard
                            key={chore.id}
                            chore={chore}
                            userId={userId}
                            type={type}
                            onAction={handleAction}
                            onToggleSubtask={toggleSubtask}
                            onEdit={setEditingChore}
                            onDelete={setDeletingChoreId}
                            loadingId={loadingId}
                        />
                    ))}
                </div>
            )}

            <EditChoreDialog
                chore={editingChore}
                open={!!editingChore}
                onOpenChange={(open) => !open && setEditingChore(null)}
            />

            <AlertDialog open={!!deletingChoreId} onOpenChange={(open) => !open && setDeletingChoreId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the chore.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                            {loadingId === deletingChoreId ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
