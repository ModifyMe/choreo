"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Home, UserPlus } from "lucide-react";

export default function OnboardingPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [mode, setMode] = useState<"create" | "join">("create");
    const [householdName, setHouseholdName] = useState("");
    const [inviteCode, setInviteCode] = useState("");

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const res = await fetch("/api/households", {
                method: "POST",
                body: JSON.stringify({ name: householdName }),
            });

            if (!res.ok) throw new Error("Failed to create household");

            toast.success("Household created!");
            router.push("/dashboard");
            router.refresh();
        } catch (error) {
            toast.error("Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const res = await fetch("/api/households/join", {
                method: "POST",
                body: JSON.stringify({ inviteCode }),
            });

            if (res.status === 404) {
                toast.error("Invalid invite code");
                return;
            }

            if (res.status === 400) {
                toast.error("You are already a member of this household");
                return;
            }

            if (!res.ok) throw new Error("Failed to join household");

            toast.success("Joined household!");
            router.push("/dashboard");
            router.refresh();
        } catch (error) {
            toast.error("Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">Welcome to Choreo</CardTitle>
                    <CardDescription>
                        To get started, create a new household or join an existing one.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <Button
                            variant={mode === "create" ? "default" : "outline"}
                            className="h-20 flex flex-col gap-2"
                            onClick={() => setMode("create")}
                        >
                            <Home className="w-6 h-6" />
                            Create New
                        </Button>
                        <Button
                            variant={mode === "join" ? "default" : "outline"}
                            className="h-20 flex flex-col gap-2"
                            onClick={() => setMode("join")}
                        >
                            <UserPlus className="w-6 h-6" />
                            Join Existing
                        </Button>
                    </div>

                    {mode === "create" ? (
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Household Name</Label>
                                <Input
                                    id="name"
                                    placeholder="e.g. The Cool Kids"
                                    value={householdName}
                                    onChange={(e) => setHouseholdName(e.target.value)}
                                    required
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? "Creating..." : "Create Household"}
                            </Button>
                        </form>
                    ) : (
                        <form onSubmit={handleJoin} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="code">Invite Code</Label>
                                <Input
                                    id="code"
                                    placeholder="e.g. X7K9P2"
                                    value={inviteCode}
                                    onChange={(e) => setInviteCode(e.target.value)}
                                    required
                                    className="uppercase"
                                    maxLength={6}
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? "Joining..." : "Join Household"}
                            </Button>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
