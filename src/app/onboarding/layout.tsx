import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function OnboardingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        // We can't easily get the full URL with query params here in a server component layout
        // without using headers or middleware.
        // However, for a simple redirect to signin, we can just redirect to /api/auth/signin.
        // The tricky part is preserving the ?code=XYZ.

        // Since we can't access the current URL in a Server Component Layout easily to construct the callbackUrl,
        // we might need to rely on the client component to handle the redirect if we want to be precise,
        // OR use middleware.

        // BUT, the user specifically asked for a fix.
        // Let's try a different approach: Middleware is the robust way.
        // But I can't easily add middleware without potentially breaking other things if I'm not careful.

        // Actually, let's use the fact that the user is likely landing on /onboarding?code=XYZ.
        // If I redirect to /api/auth/signin, NextAuth usually handles the callbackUrl automatically if triggered from the client.
        // But here we are on the server.

        // Let's try to use a Client Component wrapper for the check if we want to preserve params easily,
        // OR just redirect to signin and hope the user navigates back (bad UX).

        // Better approach: Use a Client Component in the layout that checks auth and redirects.
        // Wait, the user said "Probably cause we didn't sign in".

        // Let's stick to the plan: Create a layout.
        // To get the query params in a server component, we can't in a layout.
        // We CAN in a page.

        // So, I should actually modify `src/app/onboarding/page.tsx` to be a Server Component that checks auth?
        // But it has `useSearchParams` which requires client.

        // Hybrid approach:
        // 1. Make `page.tsx` a Server Component that fetches session.
        // 2. If no session, redirect to `/api/auth/signin?callbackUrl=/onboarding?code=...` (Wait, page props give searchParams!)
        // 3. If session, render the Client Component content.

        // This seems cleaner than a layout hack.

        // Let's discard the layout idea and refactor `page.tsx`.
        return null;
    }

    return <>{children}</>;
}
