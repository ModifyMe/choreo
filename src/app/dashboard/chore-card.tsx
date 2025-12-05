"use client";

import { useSwipeable } from "react-swipeable";
import { motion, useAnimation } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, Loader2, Camera, X, Bell, Lock, MoreVertical, Pencil, Trash2, Flame } from "lucide-react";
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
import imageCompression from "browser-image-compression";
import { cn } from "@/lib/utils";

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

    // Check if this is an optimistic chore that hasn't been saved yet
    const isOptimistic = chore.id.startsWith("temp-");

    const isOverdue = chore.dueDate && isPast(new Date(chore.dueDate)) && !isToday(new Date(chore.dueDate));

    const handleCompleteWithProof = async () => {
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
                    .uploadToSignedUrl(path, token, compressedFile);

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

    // User requested to remove locking for future due dates.
    // "due means that the chore needs to be done until that date not that the chore is locked until that date"
    const isLocked = false;

    const handlers = useSwipeable({
        onSwiping: (eventData) => {
            // Only show visual feedback for horizontal swipes on owned chores
            // Require swipe to be more horizontal than vertical (ratio > 1.5)
            const absX = Math.abs(eventData.deltaX);
            const absY = Math.abs(eventData.deltaY);
            const isHorizontal = absX > absY * 1.5;

            if ((type === "my" || chore.assignedToId === userId) && isHorizontal) {
                // Clamp the x translation to max 100px and only for rightward swipes
                const x = Math.min(Math.max(0, eventData.deltaX), 100);
                controls.set({ x });
            }
        },
        onSwipedRight: async (eventData) => {
            // Additional check: require swipe to be more horizontal than vertical
            const absX = Math.abs(eventData.deltaX);
            const absY = Math.abs(eventData.deltaY);
            const isHorizontal = absX > absY * 1.5;

            if (!isHorizontal) {
                controls.start({ x: 0 });
                return;
            }

            if (isLocked) {
                toast.error("This chore is locked until its due date!");
                controls.start({ x: 0 });
                return;
            }

            if (type === "my" || chore.assignedToId === userId) {
                // Haptic feedback
                if (navigator.vibrate) navigator.vibrate(50);

                // If proof is required, open the proof dialog instead of direct complete
                if (chore.requireProof) {
                    setDialogOpen(true);
                } else {
                    // Direct complete on swipe (bypass proof)
                    await onAction(chore.id, "COMPLETE");
                }
            }
            // Reset position after action
            controls.start({ x: 0 });
        },
        onSwiped: () => {
            // Reset position if swipe didn't complete the action
            controls.start({ x: 0 });
        },
        trackMouse: true,
        preventScrollOnSwipe: false, // Allow scroll, only prevent when clearly horizontal
        delta: 100, // Require 100px horizontal movement before triggering swipe (was 50)
        swipeDuration: 400, // Faster swipes only (was 500)
    });

    return (
        <motion.div
            {...handlers}
            animate={controls}
            className={`flex items-center justify-between p-4 border rounded-lg bg-card touch-pan-y ${isOverdue ? "border-red-300 bg-red-50 dark:bg-red-950/20" : ""}`}
        >
            <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                    <h3 className="font-medium truncate">{chore.title}</h3>
                    {chore.recurrence && chore.recurrence !== "NONE" && (
                        <div className="flex gap-1">
                            {chore.recurrence === "CUSTOM" && chore.recurrenceData ? (
                                (() => {
                                    try {
                                        const days = JSON.parse(chore.recurrenceData) as string[];
                                        const dayMap: { [key: string]: number } = { "SUN": 0, "MON": 1, "TUE": 2, "WED": 3, "THU": 4, "FRI": 5, "SAT": 6 };
                                        const todayDay = new Date().getDay();

                                        return (
                                            <div className="flex gap-0.5">
                                                {days.map(d => {
                                                    const isToday = dayMap[d] === todayDay;
                                                    return (
                                                        <span
                                                            key={d}
                                                            className={cn(
                                                                "text-[9px] px-1 py-0.5 rounded-sm font-bold uppercase",
                                                                isToday
                                                                    ? "bg-blue-600 text-white shadow-sm"
                                                                    : "bg-blue-100 text-blue-700"
                                                            )}
                                                        >
                                                            {d.substring(0, 1)}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        );
                                    } catch (e) {
                                        return (
                                            <span className="text-[10px] uppercase bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-bold">
                                                CUSTOM
                                            </span>
                                        );
                                    }
                                })()
                            ) : (
                                <span className="text-[10px] uppercase bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-bold">
                                    {chore.recurrence}
                                </span>
                            )}
                        </div>
                    )}
                </div>
                {chore.description && <p className="text-sm text-muted-foreground">{chore.description}</p>}

                {/* Subtasks Progress */}
                {chore.steps && chore.steps.filter(s => s.title !== "__CORRELATION__").length > 0 && (
                    <div className="mt-2">
                        {(() => {
                            const visibleSteps = chore.steps!.filter(s => s.title !== "__CORRELATION__");
                            return (
                                <>
                                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                                        <span>Subtasks</span>
                                        <span>
                                            {visibleSteps.filter(s => s.completed).length}/{visibleSteps.length}
                                        </span>
                                    </div>
                                    <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary transition-all duration-300"
                                            style={{ width: `${(visibleSteps.filter(s => s.completed).length / visibleSteps.length) * 100}%` }}
                                        />
                                    </div>

                                    {/* Expandable Subtasks List */}
                                    {(type === "my" || chore.assignedToId === userId) && (
                                        <div className="mt-2 space-y-1">
                                            {visibleSteps.map((step: any) => (
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
                                </>
                            );
                        })()}
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
                    {chore.priority && chore.priority !== "MEDIUM" && (
                        <span className={`flex items-center gap-1 text-[10px] font-bold uppercase ${chore.priority === "HIGH" ? "text-orange-600" : "text-slate-500"
                            }`}>
                            {chore.priority === "HIGH" && <Flame className="w-3 h-3" />}
                            {chore.priority} Priority
                        </span>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-2 ml-4">
                {type === "available" ? (
                    <Button
                        size="sm"
                        onClick={() => onAction(chore.id, "CLAIM")}
                        disabled={loadingId === chore.id || isOptimistic}
                    >
                        {loadingId === chore.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : isOptimistic ? (
                            <><Loader2 className="w-4 h-4 animate-spin mr-1" /> Syncing...</>
                        ) : (
                            "Claim"
                        )}
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
                                <DialogContent className="w-[calc(100vw-2rem)] max-w-md max-h-[85vh] overflow-y-auto">
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
