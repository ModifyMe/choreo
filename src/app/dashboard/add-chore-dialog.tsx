"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
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
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useChores, Chore } from "./chore-context";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function AddChoreDialog({ householdId }: { householdId: string }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { addChore } = useChores();

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        points: "10",
        recurrenceType: "daily",
        recurrenceData: [] as string[],
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Optimistic Update
            const tempId = Math.random().toString(36).substring(7);
            const optimisticChore: Chore = {
                id: tempId,
                title: formData.title,
                description: formData.description,
                points: parseInt(formData.points),
                recurrence: formData.recurrenceType,
                recurrenceData: JSON.stringify(formData.recurrenceData),
                householdId,
                assignedToId: null,
                status: "PENDING",
                createdAt: new Date(), // This might cause hydration mismatch if rendered, but for optimistic it's fine
                updatedAt: new Date(),
                dueDate: null,
            };

            addChore(optimisticChore);
            setOpen(false);
            toast.success("Chore created!");

            const res = await fetch("/api/chores", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    ...formData,
                    points: parseInt(formData.points),
                    householdId,
                }),
            });

            if (!res.ok) {
                throw new Error("Failed to create chore");
            }

            router.refresh();
            setFormData({
                title: "",
                description: "",
                points: "10",
                recurrenceType: "daily",
                recurrenceData: [],
            });
        } catch (error) {
            toast.error("Something went wrong");
            console.error(error);
            // Ideally we would rollback the optimistic update here, but for now we'll rely on refresh
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Chore
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add New Chore</DialogTitle>
                    <DialogDescription>
                        Create a new chore for your household.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="title">Title</Label>
                            <Input
                                id="title"
                                value={formData.title}
                                onChange={(e) =>
                                    setFormData({ ...formData, title: e.target.value })
                                }
                                placeholder="e.g., Wash dishes"
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) =>
                                    setFormData({ ...formData, description: e.target.value })
                                }
                                placeholder="Optional details..."
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="points">Points</Label>
                                <Input
                                    id="points"
                                    type="number"
                                    min="0"
                                    value={formData.points}
                                    onChange={(e) =>
                                        setFormData({ ...formData, points: e.target.value })
                                    }
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="recurrence">Recurrence</Label>
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
                                        <SelectItem value="daily">Daily</SelectItem>
                                        <SelectItem value="weekly">Weekly</SelectItem>
                                        <SelectItem value="once">One-time</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {formData.recurrenceType === "weekly" && (
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
                            {loading ? "Creating..." : "Create Chore"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
