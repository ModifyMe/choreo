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
                    toast.promise(
                        fetch("/api/push/test", {
                            method: "POST",
                            body: JSON.stringify({ householdId }),
                        }),
                        {
                            loading: 'Sending test push...',
                            success: 'Test notification sent! 🔔',
                            error: 'Failed to send test push'
                        }
                    );
                }}
            >
                Test Push
            </Button>
        </div>
    );
}
