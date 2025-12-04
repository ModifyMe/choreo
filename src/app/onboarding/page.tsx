import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { OnboardingClient } from "./onboarding-client";

export default async function OnboardingPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
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
            redirect(`/api/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`);
        }

        return <OnboardingClient code={code} />;
    }
}
