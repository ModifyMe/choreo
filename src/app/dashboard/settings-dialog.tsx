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
import { Settings, LogOut, Trash2, UserX, Camera, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
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
    ))
}
                        </div >
                    </TabsContent >
                </Tabs >
            </DialogContent >
        </Dialog >
    );
}

function ProfileSettings({ user }: { user: any }) {
    const [name, setName] = useState(user?.name || "");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch("/api/user/profile", {
                method: "PATCH",
                body: JSON.stringify({ name }),
            });

            if (!res.ok) throw new Error("Failed to update profile");

            toast.success("Profile updated");
            router.refresh();
        } catch (error) {
            toast.error("Failed to update profile");
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `avatars/${user.id}/${Math.random()}.${fileExt}`;

            // 1. Get signed URL (using chore-proofs bucket for now as it's public/configured)
            const tokenRes = await fetch("/api/upload", {
                method: "POST",
                body: JSON.stringify({ filePath: fileName, bucketName: 'chore-proofs' }),
            });

            if (!tokenRes.ok) throw new Error("Failed to get upload token");
            const { token, path } = await tokenRes.json();

            // 2. Upload to Supabase
            const { error: uploadError } = await supabase.storage
                .from('chore-proofs')
                .uploadToSignedUrl(path, token, file);

            if (uploadError) throw uploadError;

            // 3. Get Public URL
            const { data } = supabase.storage.from('chore-proofs').getPublicUrl(path);
            const publicUrl = data.publicUrl;

            // 4. Update User Profile
            const updateRes = await fetch("/api/user/profile", {
                method: "PATCH",
                body: JSON.stringify({ image: publicUrl }),
            });

            if (!updateRes.ok) throw new Error("Failed to update profile image");

            toast.success("Avatar updated");
            router.refresh();
        } catch (error) {
            console.error(error);
            toast.error("Failed to upload avatar");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="flex flex-col items-center gap-4">
                <div className="relative group cursor-pointer">
                    <Avatar className="h-24 w-24 border-2 border-border">
                        <AvatarImage src={user?.image} />
                        <AvatarFallback className="text-2xl">{user?.name?.[0] || "?"}</AvatarFallback>
                    </Avatar>
                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="w-8 h-8 text-white" />
                    </div>
                    <input
                        type="file"
                        accept="image/*"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={handleAvatarUpload}
                        disabled={loading}
                    />
                </div>
                <p className="text-xs text-muted-foreground">Tap to change avatar</p>
            </div>

            <div className="space-y-2">
                <Label htmlFor="name">Display Name</Label>
                <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                    placeholder="Enter your name"
                />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Changes
            </Button>
        </form>
    );
}
