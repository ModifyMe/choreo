"use client";

import { Button } from "@/components/ui/button";
import { Copy, UserPlus, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

export function InviteCodeButton({ code }: { code: string }) {
    const copyCode = () => {
        navigator.clipboard.writeText(code);
        toast.success("Invite code copied!");
    };

    const copyLink = () => {
        const url = `${window.location.origin}/onboarding?code=${code}`;
        navigator.clipboard.writeText(url);
        toast.success("Invite link copied!");
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" size="icon" title="Invite Members">
                    <UserPlus className="w-4 h-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-4" align="end">
                <div className="flex flex-col gap-2">
                    <h4 className="font-medium leading-none">Invite Code</h4>
                    <p className="text-sm text-muted-foreground">
                        Share this code with your family.
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                        <div className="bg-muted px-3 py-1 rounded-md font-mono font-bold tracking-wider border">
                            {code}
                        </div>
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={copyCode} title="Copy Code">
                            <Copy className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={copyLink} title="Copy Link">
                            <LinkIcon className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
