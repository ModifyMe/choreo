"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { Check, LogOut, PlusCircle, Copy, Link as LinkIcon, Trophy, Sun, Moon } from "lucide-react";
import { useRouter } from "next/navigation";
import { VacationToggle } from "@/app/dashboard/vacation-toggle";
import { toast } from "sonner";
import { useState } from "react";
import { useTheme } from "next-themes";

import { AchievementsDialog } from "@/app/dashboard/achievements-dialog";

interface UserNavProps {
    user: {
        name: string | null;
        email: string | null;
        image: string | null;
    };
    households: {
        id: string;
        name: string;
    }[];
    currentHouseholdId: string;
    inviteCode: string;
    isAway: boolean;
    achievements: any[];
}

export function UserNav({ user, households, currentHouseholdId, inviteCode, isAway, achievements }: UserNavProps) {
    const router = useRouter();
    const { theme, setTheme } = useTheme();
    const [achievementsOpen, setAchievementsOpen] = useState(false);

    const cycleTheme = () => {
        if (theme === "light") setTheme("dark");
        else if (theme === "dark") setTheme("system");
        else setTheme("light");
    };

    const getThemeLabel = () => {
        if (theme === "light") return "Light";
        if (theme === "dark") return "Dark";
        return "System";
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={user.image || ""} alt={user.name || ""} />
                            <AvatarFallback>{user.name?.[0] || "U"}</AvatarFallback>
                        </Avatar>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none">{user.name}</p>
                            <p className="text-xs leading-none text-muted-foreground">
                                {user.email}
                            </p>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <div className="px-2 py-1.5">
                        <VacationToggle householdId={currentHouseholdId} initialIsAway={isAway} minimal />
                    </div>
                    <DropdownMenuSeparator />

                    {/* Achievements - entire row is clickable */}
                    <DropdownMenuItem onClick={() => setAchievementsOpen(true)}>
                        <Trophy className="mr-2 h-4 w-4" />
                        <span>Achievements</span>
                    </DropdownMenuItem>

                    {/* Theme - entire row is clickable */}
                    <DropdownMenuItem onClick={cycleTheme}>
                        <Sun className="mr-2 h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                        <Moon className="absolute ml-0 h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                        <span className="ml-6">Theme: {getThemeLabel()}</span>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    {/* Invite Code - mobile accessible */}
                    <div className="px-2 py-2">
                        <p className="text-xs text-muted-foreground mb-1">Invite Code</p>
                        <div className="flex items-center gap-1">
                            <code className="font-mono font-bold text-sm flex-1">{inviteCode}</code>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => {
                                    navigator.clipboard.writeText(inviteCode);
                                    toast.success("Code copied!");
                                }}
                                title="Copy Code"
                            >
                                <Copy className="w-3 h-3" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => {
                                    const url = `${window.location.origin}/onboarding?code=${inviteCode}`;
                                    navigator.clipboard.writeText(url);
                                    toast.success("Invite link copied!");
                                }}
                                title="Copy Link"
                            >
                                <LinkIcon className="w-3 h-3" />
                            </Button>
                        </div>
                    </div>

                    <DropdownMenuSeparator />

                    <DropdownMenuGroup>
                        <DropdownMenuLabel>Switch Household</DropdownMenuLabel>
                        {households.map((household) => (
                            <DropdownMenuItem key={household.id} asChild>
                                <Link
                                    href={`/dashboard?householdId=${household.id}`}
                                    className="flex justify-between w-full cursor-pointer"
                                >
                                    {household.name}
                                    {household.id === currentHouseholdId && (
                                        <Check className="h-4 w-4 text-muted-foreground" />
                                    )}
                                </Link>
                            </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                            <Link href="/onboarding">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                <span>Create / Join New</span>
                            </Link>
                        </DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/" })}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                        <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Achievements Dialog - controlled externally */}
            <AchievementsDialog
                achievements={achievements}
                open={achievementsOpen}
                onOpenChange={setAchievementsOpen}
            />
        </>
    );
}
