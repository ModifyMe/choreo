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
import { Loader2, Plus, X, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useChores, Chore } from "./chore-context";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function AddChoreDialog({ householdId }: { householdId: string }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { addChore, removeOptimisticChore } = useChores();

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        points: "10",
        difficulty: "EASY",
        recurrenceType: "DAILY",
        recurrenceData: [] as string[],
        steps: [] as { id: string; title: string; completed: boolean }[],
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

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
            createdAt: new Date(),
            updatedAt: new Date(),
            dueDate: null,
            steps: formData.steps,
        };

        addChore(optimisticChore);
        setOpen(false);
        toast.success("Chore created!");

        try {
            const res = await fetch("/api/chores", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    ...formData,
                    recurrence: formData.recurrenceType, // Fix: Map recurrenceType to recurrence
                    points: parseInt(formData.points),
                    householdId,
                    steps: formData.steps,
                }),
            });

            if (!res.ok) {
                throw new Error("Failed to create chore");
            }

            // Note: We DO NOT remove the optimistic chore here anymore.
            // The ChoreContext will automatically remove it when the real chore arrives via subscription/refresh
            // to prevent flickering (gap between optimistic removal and real arrival).

            router.refresh();
            setFormData({
                title: "",
                description: "",
                points: "10",
                difficulty: "EASY",
                recurrenceType: "DAILY",
                recurrenceData: [],
                steps: [],
            });
        } catch (error) {
            toast.error("Something went wrong");
            console.error(error);
            // On error, we should also remove the optimistic chore (or show error state)
            removeOptimisticChore(tempId);
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

                <div className="px-6 pt-2">
                    <TemplateSelector onSelect={(template) => {
                        setFormData({
                            ...formData,
                            title: template.title,
                            description: template.description,
                            points: template.points.toString(),
                            difficulty: template.difficulty,
                            steps: template.steps.map(s => ({
                                id: Math.random().toString(36).substring(7),
                                title: s,
                                completed: false
                            }))
                        });
                    }} />
                </div>

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
                        <div className="grid gap-2">
                            <Label htmlFor="difficulty">Difficulty</Label>
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
                        )}

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

                        <div className="grid gap-2">
                            <div className="flex items-center justify-between">
                                <Label>Subtasks (Optional)</Label>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setFormData({
                                            ...formData,
                                            steps: [
                                                ...formData.steps,
                                                { id: Math.random().toString(36).substring(7), title: "", completed: false }
                                            ]
                                        });
                                    }}
                                >
                                    <Plus className="w-3 h-3 mr-1" /> Add Step
                                </Button>
                            </div>
                            <div className="space-y-2">
                                {formData.steps.map((step, index) => (
                                    <div key={step.id} className="flex gap-2">
                                        <Input
                                            value={step.title}
                                            onChange={(e) => {
                                                const newSteps = [...formData.steps];
                                                newSteps[index].title = e.target.value;
                                                setFormData({ ...formData, steps: newSteps });
                                            }}
                                            placeholder={`Step ${index + 1}`}
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => {
                                                const newSteps = formData.steps.filter((_, i) => i !== index);
                                                setFormData({ ...formData, steps: newSteps });
                                            }}
                                        >
                                            <X className="w-4 h-4 text-muted-foreground" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
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

import { CHORE_TEMPLATES, ChoreTemplate } from "@/lib/chore-templates";

function TemplateSelector({ onSelect }: { onSelect: (t: ChoreTemplate) => void }) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="w-full border-dashed">
                    <Wand2 className="w-4 h-4 mr-2 text-primary" />
                    Use a Template
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] h-[80vh]">
                <DialogHeader>
                    <DialogTitle>Choose a Template</DialogTitle>
                    <DialogDescription>
                        Select a template to auto-fill chore details and subtasks.
                    </DialogDescription>
                </DialogHeader>
                <div className="h-full pr-4 overflow-y-auto">
                    <div className="space-y-6">
                        {Object.entries(CHORE_TEMPLATES).map(([category, templates]) => (
                            <div key={category}>
                                <h3 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wider">{category}</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {templates.map((template) => (
                                        <div
                                            key={template.title}
                                            className="border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors flex flex-col gap-2"
                                            onClick={() => {
                                                onSelect(template);
                                                setOpen(false);
                                            }}
                                        >
                                            <div className="flex justify-between items-start">
                                                <span className="font-medium">{template.title}</span>
                                                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                                    {template.points} XP
                                                </span>
                                            </div>
                                            <p className="text-sm text-muted-foreground line-clamp-2">{template.description}</p>
                                            <div className="text-xs text-muted-foreground mt-auto pt-2 border-t">
                                                {template.steps.length} steps
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
