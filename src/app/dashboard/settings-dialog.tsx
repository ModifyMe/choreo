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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Settings, LogOut, Trash2, UserX, Camera, Loader2, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import imageCompression from "browser-image-compression";
import Webcam from "react-webcam";

export function SettingsDialog({
    householdId,
    currentMode,
    currentStrategy = "LOAD_BALANCING",
    allowMemberDelete = true,
    allowMemberDelegation = false,
    members = [],
    open,
    onOpenChange,
}: {
    householdId: string;
    currentMode: "STANDARD" | "ECONOMY";
    currentStrategy?: "LOAD_BALANCING" | "STRICT_ROTATION" | "RANDOM" | "NONE";
    allowMemberDelete?: boolean;
    allowMemberDelegation?: boolean;
    members?: any[];
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}) {
    const [internalOpen, setInternalOpen] = useState(false);
    const router = useRouter();
    const { data: session } = useSession();

    const isControlled = open !== undefined;
    const finalOpen = isControlled ? open : internalOpen;
    const finalSetOpen = isControlled ? onOpenChange : setInternalOpen;

    const [loading, setLoading] = useState(false);

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

    const handleStrategyChange = async (value: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/households/${householdId}`, {
                method: "PATCH",
                body: JSON.stringify({ assignmentStrategy: value }),
            });

            if (!res.ok) throw new Error("Failed to update settings");

            toast.success("Assignment strategy updated");
            router.refresh();
        } catch (error) {
            toast.error("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    const handleAllowDeleteChange = async (checked: boolean) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/households/${householdId}`, {
                method: "PATCH",
                body: JSON.stringify({ allowMemberDelete: checked }),
            });

            if (!res.ok) throw new Error("Failed to update settings");

            toast.success("Settings updated");
            router.refresh();
        } catch (error) {
            toast.error("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    const handleAllowDelegationChange = async (checked: boolean) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/households/${householdId}`, {
                method: "PATCH",
                body: JSON.stringify({ allowMemberDelegation: checked }),
            });

            if (!res.ok) throw new Error("Failed to update settings");

            toast.success("Settings updated");
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

    const handleRoleChange = async (memberId: string, newRole: "ADMIN" | "MEMBER") => {
        setLoading(true);
        try {
            const res = await fetch(`/api/households/${householdId}/members/${memberId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ role: newRole }),
            });

            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(errorText);
            }

            toast.success(`Role updated to ${newRole}`);
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || "Failed to update role");
        } finally {
            setLoading(false);
        }
    };

    const currentUserId = session?.user?.email;
    const currentUserMember = members.find(m => m.user.email === session?.user?.email);
    const isAdmin = currentUserMember?.role === "ADMIN";

    return (
        <Dialog open={finalOpen} onOpenChange={finalSetOpen}>
            {!isControlled && (
                <DialogTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <Settings className="w-5 h-5" />
                    </Button>
                </DialogTrigger>
            )}
            <DialogContent className="w-[calc(100vw-2rem)] max-w-[425px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Household Settings</DialogTitle>
                    <DialogDescription>
                        Manage your household preferences and members.
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="general" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="general">General</TabsTrigger>
                        <TabsTrigger value="profile">Profile</TabsTrigger>
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

                        <div className="space-y-2 pt-4 border-t">
                            <Label htmlFor="strategy" className="font-medium">Assignment Strategy</Label>
                            <p className="text-xs text-muted-foreground mb-2">
                                How should recurring chores be assigned?
                            </p>
                            <Select
                                value={currentStrategy}
                                onValueChange={handleStrategyChange}
                                disabled={loading || !isAdmin}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select strategy" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="LOAD_BALANCING">
                                        <div className="flex flex-col">
                                            <span className="font-medium">Load Balancing (Recommended)</span>
                                            <span className="text-xs text-muted-foreground">Assigns to person with least workload. Overdue chores count double. Fast completers may get more tasks but earn more XP.</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="STRICT_ROTATION">
                                        <div className="flex flex-col">
                                            <span className="font-medium">Strict Rotation</span>
                                            <span className="text-xs text-muted-foreground">True equality: cycles through members in order. Everyone gets exactly 1/N of the chores.</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="RANDOM">
                                        <div className="flex flex-col">
                                            <span className="font-medium">Random</span>
                                            <span className="text-xs text-muted-foreground">Roll the dice! Completely random assignment.</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="NONE">
                                        <div className="flex flex-col">
                                            <span className="font-medium">None (First-Come-First-Serve)</span>
                                            <span className="text-xs text-muted-foreground">Leave unassigned. Members can claim chores themselves.</span>
                                        </div>
                                    </SelectItem>
                                </SelectContent>

                            </Select>
                        </div>

                        <div className="flex items-center justify-between space-x-2 pt-4 border-t">
                            <div className="flex flex-col space-y-1">
                                <Label htmlFor="allow-delete" className="font-medium">
                                    Member Deletion
                                </Label>
                                <span className="text-xs text-muted-foreground">
                                    Allow non-admin members to delete chores.
                                </span>
                            </div>
                            <Switch
                                id="allow-delete"
                                checked={allowMemberDelete}
                                onCheckedChange={handleAllowDeleteChange}
                                disabled={loading || !isAdmin}
                            />
                        </div>

                        <div className="flex items-center justify-between space-x-2 pt-4 border-t">
                            <div className="flex flex-col space-y-1">
                                <Label htmlFor="allow-delegation" className="font-medium">
                                    Member Delegation
                                </Label>
                                <span className="text-xs text-muted-foreground">
                                    Allow non-admin members to assign chores to others.
                                </span>
                            </div>
                            <Switch
                                id="allow-delegation"
                                checked={allowMemberDelegation}
                                onCheckedChange={handleAllowDelegationChange}
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

                    <TabsContent value="profile" className="space-y-4 py-4">
                        <ProfileSettings user={currentUserMember?.user} />
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
                                            {/* Role display/dropdown */}
                                            {isAdmin && member.user.email !== session?.user?.email ? (
                                                <Select
                                                    value={member.role}
                                                    onValueChange={(value) => handleRoleChange(member.id, value as "ADMIN" | "MEMBER")}
                                                    disabled={loading}
                                                >
                                                    <SelectTrigger className="h-6 w-24 text-xs">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="ADMIN">Admin</SelectItem>
                                                        <SelectItem value="MEMBER">Member</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            ) : (
                                                <span className="text-xs text-muted-foreground capitalize">{member.role.toLowerCase()}</span>
                                            )}
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
        </Dialog >
    );
}



function ProfileSettings({ user }: { user: any }) {
    const [name, setName] = useState(user?.name || "");
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const cameraInputRef = useRef<HTMLInputElement>(null);
    const webcamRef = useRef<Webcam>(null);
    const [showCamera, setShowCamera] = useState(false);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch("/api/user/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name }),
            });

            if (!res.ok) throw new Error("Failed to update profile");

            toast.success("Profile updated!");
            router.refresh();
        } catch (error) {
            toast.error("Failed to update profile");
        } finally {
            setLoading(false);
        }
    };

    const uploadFile = async (file: File) => {
        setLoading(true);
        try {
            // Compress image
            const options = {
                maxSizeMB: 0.5, // Compress to ~500KB
                maxWidthOrHeight: 1024,
                useWebWorker: true,
            };

            let compressedFile = file;
            try {
                compressedFile = await imageCompression(file, options);
            } catch (error) {
                console.error("Compression failed, using original file", error);
            }

            // 1. Get Signed Upload Token
            const fileExt = file.name.split('.').pop() || "jpg";
            const fileName = `avatar-${Math.random()}.${fileExt}`;
            const filePath = `${user.id}/${fileName}`;

            const tokenRes = await fetch("/api/upload", {
                method: "POST",
                body: JSON.stringify({ filePath, bucketName: 'avatars' }), // Use avatars bucket
                headers: { "Content-Type": "application/json" }
            });

            if (!tokenRes.ok) throw new Error("Failed to get upload token");
            const { token, path } = await tokenRes.json();

            // 2. Upload to Supabase
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .uploadToSignedUrl(path, token, compressedFile);

            if (uploadError) throw uploadError;

            // 3. Get Public URL
            const { data } = supabase.storage.from('avatars').getPublicUrl(path);
            const publicUrl = data.publicUrl;

            // 4. Update User Profile
            const updateRes = await fetch("/api/user/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ image: publicUrl }),
            });

            if (!updateRes.ok) throw new Error("Failed to update profile image");

            toast.success("Profile picture updated!");
            router.refresh();
            setShowCamera(false);
        } catch (error) {
            console.error("Avatar upload failed", error);
            toast.error("Failed to upload avatar");
        } finally {
            setLoading(false);
        }
    };

    const capture = async () => {
        const imageSrc = webcamRef.current?.getScreenshot();
        if (imageSrc) {
            try {
                const res = await fetch(imageSrc);
                const blob = await res.blob();
                const file = new File([blob], "selfie.jpg", { type: "image/jpeg" });
                await uploadFile(file);
            } catch (error) {
                console.error("Failed to convert screenshot to file", error);
                toast.error("Failed to capture photo");
            }
        }
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        await uploadFile(file);
    };


    return (
        <div className="space-y-4">
            {showCamera ? (
                <div className="flex flex-col items-center gap-4">
                    <div className="relative rounded-full overflow-hidden border-4 border-primary w-64 h-64 shadow-xl bg-black">
                        <Webcam
                            audio={false}
                            ref={webcamRef}
                            screenshotFormat="image/jpeg"
                            videoConstraints={{ facingMode: "user", width: 400, height: 400, aspectRatio: 1 }}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={capture} disabled={loading}>
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4 mr-2" />}
                            Capture
                        </Button>
                        <Button variant="outline" onClick={() => setShowCamera(false)} disabled={loading}>
                            Cancel
                        </Button>
                    </div>
                </div>
            ) : (
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative group cursor-pointer">
                            <Avatar className="h-24 w-24 border-2 border-border">
                                <AvatarImage src={user?.image} />
                                <AvatarFallback className="text-2xl">{user?.name?.[0] || "?"}</AvatarFallback>
                            </Avatar>
                            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Upload className="w-8 h-8 text-white" />
                            </div>
                            <input
                                type="file"
                                accept="image/*"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                onChange={handleAvatarUpload}
                                disabled={loading}
                                title="Upload image"
                            />
                        </div>

                        <div className="flex flex-col items-center gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setShowCamera(true)}
                                disabled={loading}
                            >
                                <Camera className="w-4 h-4 mr-2" />
                                Take Selfie
                            </Button>
                            <p className="text-xs text-muted-foreground">or tap avatar to upload</p>
                        </div>

                        <input
                            ref={cameraInputRef}
                            type="file"
                            accept="image/*"
                            capture="user"
                            className="hidden"
                            onChange={handleAvatarUpload}
                            disabled={loading}
                        />
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
            )}
        </div>
    );
}
