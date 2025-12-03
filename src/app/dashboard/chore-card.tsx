"use client";

import { useSwipeable } from "react-swipeable";
import { motion, useAnimation } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, Loader2, Camera, X, Bell, Lock, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { format, isPast, isToday, isTomorrow, isFuture } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";
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
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { Chore } from "./chore-context";

interface ChoreCardProps {
    chore: Chore;
    userId: string;
    type: "my" | "available";
    onAction: (choreId: string, action: "CLAIM" | "COMPLETE", proofUrl?: string) => Promise<void>;
    onToggleSubtask: (choreId: string, stepId: string) => void;
    onEdit: (chore: Chore) => void;
    onDelete: (choreId: string) => void;
    loadingId: string | null;
}

export function ChoreCard({
    chore,
    userId,
    type,
    onAction,
    onToggleSubtask,
    onEdit,
    onDelete,
    loadingId,
}: ChoreCardProps) {
    const [proofFile, setProofFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const controls = useAnimation();

    const isOverdue = chore.dueDate && isPast(new Date(chore.dueDate)) && !isToday(new Date(chore.dueDate));

    const handleCompleteWithProof = async () => {
        let proofUrl = undefined;

        if (proofFile) {
            setUploading(true);
            try {
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

                const { error: uploadError } = await supabase.storage
                    .from('chore-proofs')
                    .uploadToSignedUrl(path, token, proofFile);

                if (uploadError) throw uploadError;

                const { data } = supabase.storage.from('chore-proofs').getPublicUrl(path);
                proofUrl = data.publicUrl;
            } catch (error) {
                console.error("Upload failed", error);
                toast.error(`Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`);
                setUploading(false);
                return;
            }
        }

        await onAction(chore.id, "COMPLETE", proofUrl);
        setUploading(false);
        setDialogOpen(false);
    };

    const isLocked = chore.dueDate && isFuture(new Date(chore.dueDate)) && !isToday(new Date(chore.dueDate));

    const handlers = useSwipeable({
        onSwipedRight: async () => {
            if (isLocked) {
                toast.error("This chore is locked until its due date!");
                return;
            }

            if (type === "my" || chore.assignedToId === userId) {
                // Haptic feedback
                if (navigator.vibrate) navigator.vibrate(50);

                // Direct complete on swipe (bypass proof)
                await onAction(chore.id, "COMPLETE");
            }
        },
        trackMouse: true,
        preventScrollOnSwipe: true,
    });

    return (
        <motion.div
            {...handlers}
            animate={controls}
            className={`flex items-center justify-between p-4 border rounded-lg bg-card touch-pan-y ${isOverdue ? "border-red-300 bg-red-50 dark:bg-red-950/20" : ""}`}
        >
            <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                    <h3 className="font-medium">{chore.title}</h3>
                    {chore.recurrence && chore.recurrence !== "NONE" && (
                        <span className="text-[10px] uppercase bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-bold">
                            {chore.recurrence}
                        </span>
                    )}
                </div>
                {chore.description && <p className="text-sm text-muted-foreground">{chore.description}</p>}

                {/* Subtasks Progress */}
                {chore.steps && (chore.steps as any[]).length > 0 && (
                    <div className="mt-2">
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                            <span>Subtasks</span>
                            <span>
                                {(chore.steps as any[]).filter(s => s.completed).length}/{(chore.steps as any[]).length}
                            </span>
                        </div>
                        <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary transition-all duration-300"
                                style={{ width: `${((chore.steps as any[]).filter(s => s.completed).length / (chore.steps as any[]).length) * 100}%` }}
                            />
                        </div>

                        {/* Expandable Subtasks List */}
                        {(type === "my" || chore.assignedToId === userId) && (
                            <div className="mt-2 space-y-1">
                                {(chore.steps as any[]).map((step: any) => (
                                    <div
                                        key={step.id}
                                        className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 p-1 rounded"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onToggleSubtask(chore.id, step.id);
                                        }}
                                    >
                                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${step.completed ? "bg-primary border-primary" : "border-muted-foreground"}`}>
                                            {step.completed && <CheckCircle className="w-3 h-3 text-primary-foreground" />}
                                        </div>
                                        <span className={step.completed ? "line-through text-muted-foreground" : ""}>{step.title}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                    <span className="font-semibold text-primary">{chore.points} pts</span>
                    {chore.dueDate && (
                        <span className={`flex items-center gap-1 ${isOverdue ? "text-red-600 font-bold" : ""}`}>
                            <Clock className="w-3 h-3" />
                            {isToday(new Date(chore.dueDate)) ? "Today" :
                                isTomorrow(new Date(chore.dueDate)) ? "Tomorrow" :
                                    format(new Date(chore.dueDate), "MMM d")}
                            {chore.reminderTime && (
                                <span className="ml-1 text-[10px] opacity-80">
                                    (@ {chore.reminderTime})
                                </span>
                            )}
                        </span>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-2 ml-4">
                {type === "available" ? (
                    <Button
                        size="sm"
                        onClick={() => onAction(chore.id, "CLAIM")}
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

                        {isLocked ? (
                            <Button size="sm" variant="secondary" disabled className="opacity-50 cursor-not-allowed">
                                <Lock className="w-4 h-4 mr-2" />
                                Locked
                            </Button>
                        ) : (
                            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="gap-2"
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
                                        <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
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

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(chore)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => onDelete(chore.id)}
                            className="text-red-600 focus:text-red-600"
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </motion.div>
    );
}
