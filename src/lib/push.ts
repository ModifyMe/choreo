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
            console.log(`No subscriptions found for user ${userId}`);
            return;
        }

        const payload = JSON.stringify({
            title,
            body,
            url,
        });

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
            } catch (error: any) {
                if (error.statusCode === 410 || error.statusCode === 404) {
                    // Subscription is gone, delete it
                    console.log(`Subscription expired for user ${userId}, deleting...`);
                    await prisma.pushSubscription.delete({
                        where: { id: sub.id },
                    });
                } else {
                    console.error("Error sending push notification:", error);
                }
            }
        });

        await Promise.all(promises);
    } catch (error) {
        console.error("Failed to send push notification:", error);
    }
}
