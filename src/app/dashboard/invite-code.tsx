"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Copy } from "lucide-react";
import { toast } from "sonner";

export function InviteCode({ code }: { code: string }) {
    const copyCode = () => {
        navigator.clipboard.writeText(code);
        toast.success("Invite code copied!");
    };

    return (
        <Card className="flex items-center gap-3 px-4 py-2 bg-background/50 backdrop-blur border-dashed">
            <span className="text-sm text-muted-foreground">Invite Code:</span>
            <code className="font-mono font-bold text-lg tracking-wider">{code}</code>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={copyCode}>
                <Copy className="w-4 h-4" />
            </Button>
        </Card>
    );
}
