"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BellRing, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function TestPushButton({ householdId }: { householdId: string }) {
    const [loading, setLoading] = useState(false);

    const handleTestPush = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/push/test", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ householdId }),
            });

            if (!res.ok) throw new Error("Failed to send test push");

            const data = await res.json();
            toast.success(`Sent: ${data.success}, Failed: ${data.failure}`);
        } catch (error) {
            console.error(error);
            toast.error("Failed to send test push");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button variant="outline" size="sm" onClick={handleTestPush} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BellRing className="w-4 h-4 mr-2" />}
            Test Push
        </Button>
    );
}
