import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ShoppingListProvider } from "./shopping-list-context";
import { ChoreProvider } from "../chore-context";
import { ShoppingListView } from "./shopping-list-view";

export default async function ShoppingListPage() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        redirect("/api/auth/signin");
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: {
            memberships: {
                include: {
                    household: true,
                },
            },
        },
    });

    if (!user || user.memberships.length === 0) {
        redirect("/onboarding");
    }

    const membership = user.memberships[0];
    const household = membership.household;
    const allHouseholds = user.memberships.map((m) => m.household);

    const [initialItems, myChores, availableChores] = await Promise.all([
        prisma.shoppingItem.findMany({
            where: { householdId: household.id },
            orderBy: { createdAt: "desc" },
            include: { addedBy: { select: { name: true, image: true } } }
        }),
        prisma.chore.findMany({
            where: {
                householdId: household.id,
                assignedToId: user.id,
                status: "PENDING",
            },
            orderBy: { createdAt: "desc" },
        }),
        prisma.chore.findMany({
            where: {
                householdId: household.id,
                assignedToId: null,
                status: "PENDING",
            },
            orderBy: { createdAt: "desc" },
        })
    ]);

    const serializedItems = initialItems.map((item: any) => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
    }));

    return (
        <ChoreProvider initialMyChores={myChores as any} initialAvailableChores={availableChores as any} userId={user.id} householdId={household.id}>
            <ShoppingListProvider initialItems={serializedItems} householdId={household.id}>
                <ShoppingListView />
            </ShoppingListProvider>
        </ChoreProvider>
    );
}
