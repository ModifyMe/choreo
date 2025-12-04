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
import { Check, LogOut, PlusCircle, Settings, User as UserIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { VacationToggle } from "@/app/dashboard/vacation-toggle";

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
    isAway: boolean;
}

export function UserNav({ user, households, currentHouseholdId, isAway }: UserNavProps) {
    const router = useRouter();

    return (
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
    );
}
