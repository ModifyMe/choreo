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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Settings, LogOut, Trash2, UserX } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

export function SettingsDialog({
    householdId,
    currentMode,
    members = [],
}: {
    householdId: string;
    currentMode: "STANDARD" | "ECONOMY";
    members?: any[];
}) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { data: session } = useSession();

    const handleModeChange = async (checked: boolean) => {
        setLoading(true);
        const newMode = checked ? "ECONOMY" : "STANDARD";

        try {
            const res = await fetch(`/api/households/${householdId}`, {
                method: "PATCH",
                body: JSON.stringify({ mode: newMode }),
            });

            if (!res.ok) throw new Error("Failed to update settings");

            toast.success(`Switched to ${newMode} mode`);
            router.refresh();
        } catch (error) {
            toast.error("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    const handleLeaveHousehold = async () => {
        if (!confirm("Are you sure you want to leave this household?")) return;
        setLoading(true);
        try {
            const res = await fetch("/api/households/leave", {
                method: "POST",
                body: JSON.stringify({ householdId }),
            });

            if (!res.ok) throw new Error("Failed to leave household");

            toast.success("You have left the household");
            router.push("/dashboard"); // Will redirect to another household or onboarding
            router.refresh();
        } catch (error) {
            toast.error("Failed to leave household");
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveMember = async (memberId: string) => {
        if (!confirm("Are you sure you want to remove this member?")) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/households/members/${memberId}`, {
                method: "DELETE",
                body: JSON.stringify({ householdId }),
            });

            if (!res.ok) throw new Error("Failed to remove member");

            toast.success("Member removed");
            router.refresh();
        } catch (error) {
            toast.error("Failed to remove member");
        } finally {
            setLoading(false);
        }
    };

    const currentUserId = session?.user?.email; // We need ID, but email is what we have in session usually. 
    // Actually session.user.id is available in our auth setup usually, let's check.
    // If not, we can find current member from members list using email.
    const currentUserMember = members.find(m => m.user.email === session?.user?.email);
    const isAdmin = currentUserMember?.role === "ADMIN";

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Settings className="w-5 h-5" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Household Settings</DialogTitle>
                    <DialogDescription>
                        Manage your household preferences and members.
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="general" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="general">General</TabsTrigger>
                        <TabsTrigger value="members">Members</TabsTrigger>
                    </TabsList>

                    <TabsContent value="general" className="space-y-4 py-4">
                        <div className="flex items-center justify-between space-x-2">
                            <div className="flex flex-col space-y-1">
                                <Label htmlFor="economy-mode" className="font-medium">
                                    Economy Mode
                                </Label>
                                <span className="text-xs text-muted-foreground">
                                    Earn Gold for chores and spend it on rewards.
                                </span>
                            </div>
                            <Switch
                                id="economy-mode"
                                checked={currentMode === "ECONOMY"}
                                onCheckedChange={handleModeChange}
                                disabled={loading || !isAdmin}
                            />
                        </div>

                        <div className="pt-4 border-t">
                            <Button
                                variant="destructive"
                                className="w-full"
                                onClick={handleLeaveHousehold}
                                disabled={loading}
                            >
                                <LogOut className="w-4 h-4 mr-2" />
                                Leave Household
                            </Button>
                        </div>
                    </TabsContent>

                    <TabsContent value="members" className="space-y-4 py-4">
                        <div className="space-y-4">
                            {members.map((member) => (
                                <div key={member.id} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={member.user.image} />
                                            <AvatarFallback>{member.user.name?.[0] || "?"}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium">
                                                {member.user.name}
                                                {member.user.email === session?.user?.email && " (You)"}
                                            </span>
                                            <span className="text-xs text-muted-foreground capitalize">{member.role.toLowerCase()}</span>
                                        </div>
                                    </div>

                                    {isAdmin && member.user.email !== session?.user?.email && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                            onClick={() => handleRemoveMember(member.id)}
                                            disabled={loading}
                                        >
                                            <UserX className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
