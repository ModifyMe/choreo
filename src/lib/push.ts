import webpush from "web-push";
import { prisma } from "@/lib/prisma";

// Configure web-push with VAPID keys
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        process.env.VAPID_SUBJECT || "mailto:admin@choreo.top",
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
}

export async function sendPushNotification(userId: string, title: string, body: string, url: string = "/") {
    try {
        const subscriptions = await prisma.pushSubscription.findMany({
            where: { userId },
        });

        if (subscriptions.length === 0) {
            // No push subscriptions for this user
            return { success: 0, failure: 0, total: 0 };
        }

        const payload = JSON.stringify({
            title,
            body,
            url,
        });

        let successCount = 0;
        let failureCount = 0;

        const promises = subscriptions.map(async (sub) => {
            try {
                await webpush.sendNotification(
                    {
                        endpoint: sub.endpoint,
                        keys: {
                            p256dh: sub.p256dh,
                            auth: sub.auth,
                        },
                    },
                    payload
                );
                successCount++;
            } catch (error: any) {
                if (error.statusCode === 410 || error.statusCode === 404) {
                    // Subscription is gone, delete it
                    await prisma.pushSubscription.delete({
                        where: { id: sub.id },
                    });
                }
                // Other errors are silently ignored - monitoring can be added if needed
                failureCount++;
            }
        });

        await Promise.all(promises);
        return { success: successCount, failure: failureCount, total: subscriptions.length };
    } catch {
        // Failed to send push notification
        return { success: 0, failure: 0, total: 0 };
    }
}
