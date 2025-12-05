"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function UpdatePrompt() {
    const [showPrompt, setShowPrompt] = useState(false);
    const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

    useEffect(() => {
        if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
            return;
        }

        const handleUpdate = async () => {
            try {
                const registration = await navigator.serviceWorker.ready;

                // Check for updates on focus (user returns to tab)
                const checkForUpdates = () => {
                    registration.update().catch(console.error);
                };

                // Check for updates when tab becomes visible
                document.addEventListener("visibilitychange", () => {
                    if (document.visibilityState === "visible") {
                        checkForUpdates();
                    }
                });

                // Also check periodically (every 5 minutes)
                const interval = setInterval(checkForUpdates, 5 * 60 * 1000);

                // Listen for new service worker installing
                registration.addEventListener("updatefound", () => {
                    const newWorker = registration.installing;
                    if (!newWorker) return;

                    newWorker.addEventListener("statechange", () => {
                        // New service worker is installed and waiting
                        if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                            setWaitingWorker(newWorker);
                            setShowPrompt(true);
                        }
                    });
                });

                // If there's already a waiting worker on page load
                if (registration.waiting) {
                    setWaitingWorker(registration.waiting);
                    setShowPrompt(true);
                }

                return () => {
                    clearInterval(interval);
                };
            } catch (error) {
                console.error("SW registration error:", error);
            }
        };

        handleUpdate();

        // Listen for controller change (when skipWaiting is called)
        let refreshing = false;
        navigator.serviceWorker.addEventListener("controllerchange", () => {
            if (refreshing) return;
            refreshing = true;
            window.location.reload();
        });
    }, []);

    const handleRefresh = () => {
        if (waitingWorker) {
            // Tell the waiting service worker to take over
            waitingWorker.postMessage({ type: "SKIP_WAITING" });
        } else {
            // Fallback: just reload
            window.location.reload();
        }
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
                        A new version of Choreo is ready. Refresh to get the latest features!
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
                    Refresh Now
                </Button>
            </div>
        </div>
    );
}
