"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Users } from "lucide-react";
import { useChores } from "./chore-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";

export function HouseholdChoresDialog() {
    const { householdChores } = useChores();

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="icon" title="Household Chores">
                    <Users className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Household Chores</DialogTitle>
                    <DialogDescription>
                        Chores currently claimed by other members.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                    {householdChores.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground italic">
                            No active chores for other members.
                        </div>
                    ) : (
                        householdChores.map((chore) => (
                            <div key={chore.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                                <div className="space-y-1">
                                    <p className="font-medium leading-none">{chore.title}</p>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <span>{chore.points} XP</span>
                                        <span>•</span>
                                        <span>{formatDistanceToNow(new Date(chore.createdAt), { addSuffix: true })}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground hidden sm:inline-block">
                                        {chore.assignedTo?.name || "Unknown"}
                                    </span>
                                    <Avatar className="h-8 w-8 border">
                                        <AvatarImage src={chore.assignedTo?.image || undefined} className="object-cover" />
                                        <AvatarFallback>{chore.assignedTo?.name?.[0] || "?"}</AvatarFallback>
                                    </Avatar>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
