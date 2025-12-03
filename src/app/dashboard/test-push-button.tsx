"use client";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function TestPushButton({ householdId }: { householdId: string }) {
    return (
        <div className="fixed bottom-2 right-2 opacity-0 hover:opacity-100 transition-opacity">
            <Button
                variant="ghost"
                size="sm"
                className="text-[10px] text-muted-foreground"
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
