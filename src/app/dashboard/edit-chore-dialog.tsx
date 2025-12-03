"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
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
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useChores, Chore } from "./chore-context";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface EditChoreDialogProps {
    chore: Chore | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EditChoreDialog({ chore, open, onOpenChange }: EditChoreDialogProps) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { updateChore } = useChores();

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        points: "10",
        difficulty: "EASY",
        recurrenceType: "DAILY",
        recurrenceData: [] as string[],
    });

    useEffect(() => {
        if (chore) {
            let parsedRecurrenceData: string[] = [];
            try {
                if (chore.recurrenceData) {
                    // Handle both JSON string and potentially plain string if legacy
                    parsedRecurrenceData = JSON.parse(chore.recurrenceData);
                    if (!Array.isArray(parsedRecurrenceData)) {
                        parsedRecurrenceData = [];
                    }
                }
            } catch (e) {
                console.error("Failed to parse recurrence data", e);
                parsedRecurrenceData = [];
            }

            let difficulty = "CUSTOM";
            if (chore.points === 10) difficulty = "EASY";
            if (chore.points === 30) difficulty = "MEDIUM";
            if (chore.points === 50) difficulty = "HARD";
            if (chore.points === 100) difficulty = "EPIC";

            setFormData({
                title: chore.title,
                description: chore.description || "",
                points: chore.points.toString(),
                difficulty,
                recurrenceType: chore.recurrence || "DAILY",
                recurrenceData: parsedRecurrenceData,
            });
        }
    }, [chore]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!chore) return;
        setLoading(true);

        try {
            // Optimistic Update
            const updates: Partial<Chore> = {
                title: formData.title,
                description: formData.description,
                points: parseInt(formData.points),
                recurrence: formData.recurrenceType,
                recurrenceData: JSON.stringify(formData.recurrenceData),
            };

            updateChore(chore.id, updates);
            onOpenChange(false);
            toast.success("Chore updated!");

            const res = await fetch(`/api/chores/${chore.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    title: formData.title,
                    description: formData.description,
                    points: parseInt(formData.points),
                    recurrenceType: formData.recurrenceType, // Backend might expect recurrenceType or recurrence
                    recurrenceData: formData.recurrenceData, // Backend might expect array
                }),
            });

            if (!res.ok) {
                throw new Error("Failed to update chore");
            }

            router.refresh();
        } catch (error) {
            toast.error("Something went wrong");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Chore</DialogTitle>
                    <DialogDescription>
                        Make changes to the chore details.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="edit-title">Title</Label>
                            <Input
                                id="edit-title"
                                value={formData.title}
                                onChange={(e) =>
                                    setFormData({ ...formData, title: e.target.value })
                                }
                                placeholder="e.g., Wash dishes"
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-description">Description</Label>
                            <Textarea
                                id="edit-description"
                                value={formData.description}
                                onChange={(e) =>
                                    setFormData({ ...formData, description: e.target.value })
                                }
                                placeholder="Optional details..."
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-difficulty">Difficulty</Label>
                            <Select
                                value={formData.difficulty}
                                onValueChange={(value) => {
                                    let points = "10";
                                    if (value === "EASY") points = "10";
                                    if (value === "MEDIUM") points = "30";
                                    if (value === "HARD") points = "50";
                                    if (value === "EPIC") points = "100";

                                    setFormData({
                                        ...formData,
                                        difficulty: value,
                                        points: value === "CUSTOM" ? formData.points : points
                                    });
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="EASY">🟢 Easy (10 XP)</SelectItem>
                                    <SelectItem value="MEDIUM">🟡 Medium (30 XP)</SelectItem>
                                    <SelectItem value="HARD">🔴 Hard (50 XP)</SelectItem>
                                    <SelectItem value="EPIC">🟣 Epic (100 XP)</SelectItem>
                                    <SelectItem value="CUSTOM">⚪ Custom</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-[0.8rem] text-muted-foreground">
                                {formData.difficulty === "EASY" && "e.g., Take out trash, check mail"}
                                {formData.difficulty === "MEDIUM" && "e.g., Vacuum room, load dishwasher"}
                                {formData.difficulty === "HARD" && "e.g., Clean bathroom, mow lawn"}
                                {formData.difficulty === "EPIC" && "e.g., Deep clean garage, wash car"}
                            </p>
                        </div>

                        {formData.difficulty === "CUSTOM" && (
                            <div className="grid gap-2">
                                <Label htmlFor="edit-points">Points</Label>
                                <Input
                                    id="edit-points"
                                    type="number"
                                    min="0"
                                    value={formData.points}
                                    onChange={(e) =>
                                        setFormData({ ...formData, points: e.target.value })
                                    }
                                    required
                                />
                            </div>
                        )}

                        <div className="grid gap-2">
                            <Label htmlFor="edit-recurrence">Recurrence</Label>
                            <Select
                                value={formData.recurrenceType}
                                onValueChange={(value) =>
                                    setFormData({ ...formData, recurrenceType: value })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="DAILY">Daily</SelectItem>
                                    <SelectItem value="WEEKLY">Weekly</SelectItem>
                                    <SelectItem value="MONTHLY">Monthly</SelectItem>
                                    <SelectItem value="BI_MONTHLY">Bi-Monthly</SelectItem>
                                    <SelectItem value="CUSTOM">Custom (Select Days)</SelectItem>
                                    <SelectItem value="NONE">One-time</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {formData.recurrenceType === "CUSTOM" && (
                            <div className="grid gap-2">
                                <Label>Repeat on</Label>
                                <div className="flex flex-wrap gap-2">
                                    {DAYS.map((day) => (
                                        <div
                                            key={day}
                                            onClick={() => {
                                                const current = formData.recurrenceData;
                                                const isSelected = current.includes(day);
                                                setFormData({
                                                    ...formData,
                                                    recurrenceData: isSelected
                                                        ? current.filter((d) => d !== day)
                                                        : [...current, day],
                                                });
                                            }}
                                            className={cn(
                                                "cursor-pointer px-3 py-1 rounded-full text-xs font-medium border transition-colors",
                                                formData.recurrenceData.includes(day)
                                                    ? "bg-primary text-primary-foreground border-primary"
                                                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                                            )}
                                        >
                                            {day}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            {loading ? "Updating..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
