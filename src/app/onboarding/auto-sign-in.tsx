"use client";

import { useEffect } from "react";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";

export function AutoSignIn({ callbackUrl }: { callbackUrl: string }) {
    useEffect(() => {
        signIn("google", { callbackUrl });
    }, [callbackUrl]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Redirecting to Google...</p>
        </div>
    );
}
