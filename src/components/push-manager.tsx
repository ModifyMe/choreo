"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

function urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, "+")
        .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export function PushNotificationManager() {
    const [isSupported, setIsSupported] = useState(false);
    const [subscription, setSubscription] = useState<PushSubscription | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if ("serviceWorker" in navigator && "PushManager" in window) {
            setIsSupported(true);
            registerServiceWorker();
        }
    }, []);

    async function registerServiceWorker() {
        try {
            const registration = await navigator.serviceWorker.register("/sw.js");
            const sub = await registration.pushManager.getSubscription();
            setSubscription(sub);

            if (sub) {
                // Sync with server in case DB was cleared
                const res = await fetch("/api/push/subscribe", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(sub),
                });

                if (!res.ok) {
                    throw new Error("Failed to sync push subscription");
                }
                console.log("Push subscription synced with server");
            }
        } catch (error) {
            console.error("Service Worker registration failed:", error);
            // Only show toast if it's a sync error, not a registration error (which happens in incognito etc)
            if (error instanceof Error && error.message.includes("sync")) {
                toast.error("Failed to sync push notifications. Please re-enable.");
            }
        }
    }

    async function subscribeToPush() {
        setLoading(true);
        try {
            const registration = await navigator.serviceWorker.ready;
            const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

            if (!vapidPublicKey) {
                throw new Error("VAPID Public Key is missing");
            }

            const sub = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
            });

            setSubscription(sub);

            // Send subscription to server
            const res = await fetch("/api/push/subscribe", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(sub),
            });

            if (!res.ok) {
                throw new Error("Failed to save subscription to server");
            }

            toast.success("Notifications enabled! 🔔");
        } catch (error) {
            console.error("Failed to subscribe:", error);
            toast.error("Failed to enable notifications.");
        } finally {
            setLoading(false);
        }
    }

    async function unsubscribeFromPush() {
        setLoading(true);
        try {
            const registration = await navigator.serviceWorker.ready;
            const sub = await registration.pushManager.getSubscription();

            if (sub) {
                await sub.unsubscribe();
                setSubscription(null);

                // Optional: Notify server to remove subscription (though we handle 410s automatically)
                // For now, just clearing local state is enough to allow re-subscribing
                toast.success("Notifications disabled.");
            }
        } catch (error) {
            console.error("Failed to unsubscribe:", error);
            toast.error("Failed to disable notifications.");
        } finally {
            setLoading(false);
        }
    }

    async function sendLocalTest() {
        try {
            const registration = await navigator.serviceWorker.ready;
            await registration.showNotification("Local Test 🔔", {
                body: "If you see this, your browser and OS allow notifications!",
                icon: "/icon-192x192.png",
            });
            toast.success("Local notification sent!");
        } catch (error) {
            console.error("Failed to send local notification:", error);
            toast.error("Failed to send local notification. Check OS settings.");
        }
    }

    if (!isSupported) {
        return null; // Don't show if not supported
    }

    return (
        <div className="flex items-center gap-2">
            {subscription ? (
                <Button
                    variant="outline"
                    size="icon"
                    onClick={unsubscribeFromPush}
                    disabled={loading}
                    title="Notifications Enabled (Click to disable)"
                    className="text-green-500 border-green-200 bg-green-50 hover:bg-green-100"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
                </Button>
            ) : (
                <Button
                    variant="outline"
                    size="icon"
                    onClick={subscribeToPush}
                    disabled={loading}
                    title="Enable Notifications"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BellOff className="w-4 h-4" />}
                </Button>
            )}

            {/* Debug/Troubleshoot Trigger (Hidden) */}
            {/* <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground opacity-50 hover:opacity-100"
                title="Troubleshoot Notifications"
                onClick={sendLocalTest}
            >
                <span className="text-xs">?</span>
            </Button> */}
        </div>
    );
}
