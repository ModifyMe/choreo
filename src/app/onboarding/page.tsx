import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { OnboardingClient } from "./onboarding-client";
import { AutoSignIn } from "./auto-sign-in";
import { prisma } from "@/lib/prisma";

export default async function OnboardingPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const session = await getServerSession(authOptions);
    const resolvedParams = await searchParams;
    const rawCode = resolvedParams?.code;
    const code = typeof rawCode === "string" ? rawCode.trim().toUpperCase() : undefined;

    if (!session?.user?.email) {
        const callbackUrl = code ? `/onboarding?${new URLSearchParams({ code })}` : "/onboarding";
        return <AutoSignIn callbackUrl={callbackUrl} />;
    }

    const invitation = code ? await prisma.household.findUnique({
        where: { inviteCode: code }, select: { name: true },
    }) : null;
    return <OnboardingClient key={code || "new"} code={code} inviteHouseholdName={invitation?.name} />;
}
