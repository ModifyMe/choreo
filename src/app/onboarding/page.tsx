import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { OnboardingClient } from "./onboarding-client";

export default async function OnboardingPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    try {
        const session = await getServerSession(authOptions);
        const resolvedParams = await searchParams;
        const code = resolvedParams?.code as string;

        console.log("OnboardingPage: Session:", session?.user?.email ? "Authenticated" : "Not Authenticated");
        console.log("OnboardingPage: Code:", code);

        if (!session?.user?.email) {
            const callbackUrl = code ? `/onboarding?code=${code}` : "/onboarding";
            console.log("OnboardingPage: Redirecting to:", callbackUrl);
            redirect(`/api/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`);
        }

        return <OnboardingClient code={code} />;
    } catch (error) {
        // redirect() throws an error that Next.js catches, so we must re-throw it
        if ((error as any)?.digest?.startsWith?.('NEXT_REDIRECT')) {
            throw error;
        }
        console.error("OnboardingPage Error:", error);
        return (
            <div className="p-8 text-center">
                <h1 className="text-xl font-bold text-red-500">Something went wrong</h1>
                <p className="text-muted-foreground">Please try refreshing the page.</p>
                <pre className="mt-4 text-xs bg-muted p-2 rounded text-left overflow-auto max-w-md mx-auto">
                    {JSON.stringify(error, null, 2)}
                </pre>
            </div>
        );
    }
}
