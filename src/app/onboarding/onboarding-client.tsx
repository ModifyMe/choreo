"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Home, UserPlus, Loader2 } from "lucide-react";

export function OnboardingClient({ code, inviteHouseholdName }: { code?: string; inviteHouseholdName?: string }) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [mode, setMode] = useState<"create" | "join">(code ? "join" : "create");
    const [householdName, setHouseholdName] = useState("");
    const [inviteCode, setInviteCode] = useState(code || "");
    const [error, setError] = useState("");
    const [useLink, setUseLink] = useState(Boolean(code && inviteHouseholdName));

    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault();
        if (isLoading) return;
        setIsLoading(true);
        setError("");
        try {
            const response = await fetch(mode === "join" ? "/api/households/join" : "/api/households", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(mode === "join" ? { inviteCode: inviteCode.trim().toUpperCase() } : { name: householdName.trim() }),
            });
            if (!response.ok) {
                if (response.status === 404) throw new Error("This invitation is no longer valid. Ask a household member for a new link.");
                if (response.status === 401) throw new Error("Your sign-in expired. Reload this page to sign in again.");
                if (response.status === 400) throw new Error(await response.text());
                throw new Error("We couldn’t save your household. Please try again.");
            }
            const household = await response.json();
            router.push(`/dashboard?householdId=${encodeURIComponent(household.id)}`);
            router.refresh();
        } catch (error) {
            setError(error instanceof Error ? error.message : "Something went wrong. Please try again.");
            setIsLoading(false);
        }
    }

    return (
        <div className="min-h-dvh flex items-center justify-center bg-muted/50 p-4 py-8">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="break-words text-2xl">{useLink && mode === "join" ? `Join ${inviteHouseholdName}` : "Welcome to Choreo"}</CardTitle>
                    <CardDescription>
                        {useLink && mode === "join" ? "Your invitation is ready. Join this household to get started." : "Create a new household or join an existing one."}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        {(["create", "join"] as const).map((option) => (
                            <Button key={option} variant={mode === option ? "default" : "outline"}
                                className="h-20 flex flex-col gap-2" disabled={isLoading}
                                aria-pressed={mode === option} onClick={() => { setMode(option); setError(""); }}>
                                {option === "create" ? <Home className="w-6 h-6" /> : <UserPlus className="w-6 h-6" />}
                                {option === "create" ? "Create New" : "Join Existing"}
                            </Button>
                        ))}
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {mode === "create" ? (
                            <div className="space-y-2">
                                <Label htmlFor="name">Household Name</Label>
                                <Input id="name" placeholder="e.g. Our home" value={householdName}
                                    onChange={event => setHouseholdName(event.target.value)} required disabled={isLoading} />
                            </div>
                        ) : useLink ? (
                            <div className="space-y-2">
                                <p className="rounded-lg bg-muted p-4 text-sm leading-relaxed">
                                    You&apos;re invited to <strong className="break-words">{inviteHouseholdName}</strong>.
                                    Your link already includes the invite code.
                                </p>
                                <Button type="button" variant="link" className="px-0" disabled={isLoading}
                                    onClick={() => { setUseLink(false); setInviteCode(""); setError(""); }}>Use a different invite code</Button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <Label htmlFor="code">Invite Code</Label>
                                <Input id="code" placeholder="e.g. X7K9P2" value={inviteCode}
                                    onChange={event => setInviteCode(event.target.value.toUpperCase())} required
                                    className="uppercase" maxLength={6} autoCapitalize="characters" autoCorrect="off" disabled={isLoading} />
                            </div>
                        )}
                        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
                        <Button type="submit" className="w-full" disabled={isLoading || (mode === "create" ? !householdName.trim() : inviteCode.trim().length !== 6)}>
                            {isLoading && <Loader2 className="size-4 animate-spin" />}
                            {mode === "join" ? (isLoading ? "Joining…" : "Join Household") : (isLoading ? "Creating…" : "Create Household")}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
