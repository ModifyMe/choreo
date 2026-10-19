"use client";

import { useEffect, useRef } from "react";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";

export function AutoSignIn({ callbackUrl }: { callbackUrl: string }) {
    const signingIn = useRef(false);
    useEffect(() => {
        if (signingIn.current) return;
        signingIn.current = true;
        signIn("google", { callbackUrl: new URL(callbackUrl, window.location.origin).href });
    }, [callbackUrl]);

    return (
        <div className="min-h-dvh flex flex-col items-center justify-center bg-background p-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Redirecting to Google...</p>
        </div>
    );
}
