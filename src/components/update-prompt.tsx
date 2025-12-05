"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function UpdatePrompt() {
    const [showPrompt, setShowPrompt] = useState(false);
    const initialVersionRef = useRef<string | null>(null);

    useEffect(() => {
        if (typeof window === "undefined") return;

        const checkVersion = async () => {
            try {
                const res = await fetch("/api/version", { cache: "no-store" });
                if (!res.ok) return;

                const data = await res.json();
                const currentVersion = data.version;

                // Store initial version on first check
                if (initialVersionRef.current === null) {
                    initialVersionRef.current = currentVersion;
                    return;
                }

                // Show prompt if version changed
                if (currentVersion !== initialVersionRef.current) {
                    setShowPrompt(true);
                }
            } catch (error) {
                console.error("Version check failed:", error);
            }
        };

        // Check immediately
        checkVersion();

        // Check every 30 seconds
        const interval = setInterval(checkVersion, 30 * 1000);

        // Also check when tab becomes visible
        const handleVisibility = () => {
            if (document.visibilityState === "visible") {
                checkVersion();
            }
        };
        document.addEventListener("visibilitychange", handleVisibility);

        return () => {
            clearInterval(interval);
            document.removeEventListener("visibilitychange", handleVisibility);
        };
    }, []);

    const handleRefresh = () => {
        window.location.reload();
    };

    const handleDismiss = () => {
        setShowPrompt(false);
    };

    if (!showPrompt) return null;

    return (
        <div
            className={cn(
                "fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80",
                "bg-card border rounded-lg shadow-lg p-4 z-50",
                "animate-in slide-in-from-bottom-5 duration-300"
            )}
        >
            <div className="flex items-start gap-3">
                <div className="bg-primary/10 rounded-full p-2">
                    <RefreshCw className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">Update Available</p>
                    <p className="text-xs text-muted-foreground mt-1">
                        A new version of Choreo is ready!
                    </p>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0"
                    onClick={handleDismiss}
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>
            <div className="flex gap-2 mt-3">
                <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={handleDismiss}
                >
                    Later
                </Button>
                <Button
                    size="sm"
                    className="flex-1"
                    onClick={handleRefresh}
                >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                </Button>
            </div>
        </div>
    );
}
