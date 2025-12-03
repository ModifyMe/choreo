"use client";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function TestPushButton({ householdId }: { householdId: string }) {
    return (
        <div className="fixed bottom-4 right-4 z-50">
            <Button
                variant="outline"
                size="sm"
                className="text-xs bg-background/50 backdrop-blur-sm hover:bg-background"
                onClick={async () => {
                    const promise = fetch("/api/push/test", {
                        method: "POST",
                        body: JSON.stringify({ householdId }),
                    }).then(async (res) => {
                        if (!res.ok) throw new Error("Failed to send");
                        const data = await res.json();
                        if (data.total === 0) throw new Error("No devices subscribed!");
                        if (data.success === 0) throw new Error(`Failed to send to ${data.total} devices`);
                        return `Sent to ${data.success}/${data.total} devices`;
                    });

                    toast.promise(promise, {
                        loading: 'Sending test push...',
                        success: (msg) => `${msg} 🔔`,
                        error: (err) => err.message
                    });
                }}
            >
                Test Push
            </Button>
        </div>
    );
}
