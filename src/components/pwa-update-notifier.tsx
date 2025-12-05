"use client";

import { useEffect } from "react";
import { toast } from "sonner";

export function PWAUpdateNotifier() {
    useEffect(() => {
        if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
            return;
        }

        const checkForUpdates = async () => {
            try {
                const registration = await navigator.serviceWorker.getRegistration();
                if (!registration) return;

                // Check for updates
                registration.addEventListener("updatefound", () => {
                    const newWorker = registration.installing;
                    if (!newWorker) return;

                    newWorker.addEventListener("statechange", () => {
                        if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                            // New version available
                            toast("New version available!", {
                                description: "Tap to refresh and get the latest features.",
                                duration: Infinity,
                                action: {
                                    label: "Refresh",
                                    onClick: () => {
                                        // Tell SW to skip waiting and activate
                                        newWorker.postMessage({ type: "SKIP_WAITING" });
                                        window.location.reload();
                                    },
                                },
                            });
                        }
                    });
                });

                // Also check if there's already a waiting worker
                if (registration.waiting) {
                    toast("New version available!", {
                        description: "Tap to refresh and get the latest features.",
                        duration: Infinity,
                        action: {
                            label: "Refresh",
                            onClick: () => {
                                registration.waiting?.postMessage({ type: "SKIP_WAITING" });
                                window.location.reload();
                            },
                        },
                    });
                }

                // Trigger update check
                registration.update();
            } catch (error) {
                console.error("SW update check failed:", error);
            }
        };

        // Check on mount
        checkForUpdates();

        // Also listen for controller change (when new SW takes over)
        navigator.serviceWorker.addEventListener("controllerchange", () => {
            // Reload to get fresh content
            window.location.reload();
        });
    }, []);

    return null;
}
