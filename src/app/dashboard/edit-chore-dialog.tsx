"use client";

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
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Chore {
    id: string;
    title: string;
    description: string | null;
    points: number;
    dueDate: Date | null;
    recurrence: string | null;
    recurrenceData?: string | null;
}

interface EditChoreDialogProps {
    chore: Chore | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EditChoreDialog({ chore, open, onOpenChange }: EditChoreDialogProps) {
    const [loading, setLoading] = useState(false);
    const [date, setDate] = useState<Date | undefined>();
    const [recurrence, setRecurrence] = useState("NONE");
    const [recurrenceData, setRecurrenceData] = useState<string[]>([]);
    const router = useRouter();

    useEffect(() => {
        if (chore) {
            setDate(chore.dueDate ? new Date(chore.dueDate) : undefined);
            setRecurrence(chore.recurrence || "NONE");
            if (chore.recurrenceData) {
                try {
                    setRecurrenceData(JSON.parse(chore.recurrenceData));
                } catch (e) {
                    setRecurrenceData([]);
                }
            } else {
                setRecurrenceData([]);
            }
        }
    }, [chore]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!chore) return;
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const title = formData.get("title") as string;
        const description = formData.get("description") as string;
        const points = formData.get("points") as string;

        try {
            const res = await fetch(`/api/chores/${chore.id}`, {
                method: "PATCH",
                body: JSON.stringify({
                    action: "EDIT",
                    title,
                    description,
                    points,
                    dueDate: date,
                    recurrence,
                    recurrenceData: recurrence === "CUSTOM" ? JSON.stringify(recurrenceData) : null,
                }),
            });

            if (!res.ok) throw new Error("Failed to update chore");

            toast.success("Chore updated successfully");
            onOpenChange(false);
            router.refresh();
        } catch (error) {
            toast.error("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    if (!chore) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Chore</DialogTitle>
                    <DialogDescription>
                        Update the details of this chore.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="title" className="text-right">
                                Title
                            </Label>
                            <Input
                                id="title"
                                name="title"
                                defaultValue={chore.title}
                                placeholder="e.g. Wash Dishes"
                                className="col-span-3"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="description" className="text-right">
                                Description
                            </Label>
                            <Textarea
                                id="description"
                                name="description"
                                defaultValue={chore.description || ""}
                                placeholder="Optional details..."
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="points" className="text-right">
                                Points
                            </Label>
                            <Input
                                id="points"
                                name="points"
                                type="number"
                                defaultValue={chore.points}
                                placeholder="10"
                                className="col-span-3"
                                required
                                min="1"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Due Date</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "col-span-3 justify-start text-left font-normal",
                                            !date && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {date ? format(date, "PPP") : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={date}
                                        onSelect={setDate}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Recurrence</Label>
                            <div className="col-span-3 space-y-2">
                                <Select value={recurrence} onValueChange={setRecurrence}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select recurrence" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="NONE">None</SelectItem>
                                        <SelectItem value="DAILY">Daily</SelectItem>
                                        <SelectItem value="WEEKLY">Weekly</SelectItem>
                                        <SelectItem value="MONTHLY">Monthly</SelectItem>
                                        <SelectItem value="BI_MONTHLY">Bi-Monthly (Every 2 months)</SelectItem>
                                        <SelectItem value="CUSTOM">Custom Days</SelectItem>
                                    </SelectContent>
                                </Select>

                                {recurrence === "CUSTOM" && (
                                    <div className="flex flex-wrap gap-2 pt-2">
                                        {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map((day) => (
                                            <div
                                                key={day}
                                                onClick={() => {
                                                    setRecurrenceData((prev) =>
                                                        prev.includes(day)
                                                            ? prev.filter((d) => d !== day)
                                                            : [...prev, day]
                                                    );
                                                }}
                                                className={cn(
                                                    "cursor-pointer px-3 py-1 rounded-full text-xs font-medium border transition-colors",
                                                    recurrenceData.includes(day)
                                                        ? "bg-primary text-primary-foreground border-primary"
                                                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                                                )}
                                            >
                                                {day}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
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
