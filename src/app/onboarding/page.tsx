import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { OnboardingClient } from "./onboarding-client";
import { AutoSignIn } from "./auto-sign-in";

export default async function OnboardingPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const session = await getServerSession(authOptions);
    const resolvedParams = await searchParams;
    const code = resolvedParams?.code as string;

    if (!session?.user?.email) {
        const callbackUrl = code ? `/onboarding?code=${code}` : "/onboarding";
        return <AutoSignIn callbackUrl={callbackUrl} />;
    }

    return <OnboardingClient code={code} />;
}
