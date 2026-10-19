import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ShoppingListProvider } from "./shopping-list-context";
import { ShoppingListView } from "./shopping-list-view";

export default async function ShoppingListPage({ searchParams }: { searchParams: Promise<{ householdId?: string }> }) {
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

    const { householdId } = await searchParams;
    const membership = user.memberships.find(m => m.householdId === householdId) ?? user.memberships[0];
    const household = membership.household;
    const initialItems = await prisma.shoppingItem.findMany({
        where: { householdId: household.id },
        orderBy: { createdAt: "desc" },
        include: { addedBy: { select: { name: true, image: true } } },
    });

    const serializedItems = initialItems.map((item) => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
    }));

    return (
        <ShoppingListProvider initialItems={serializedItems} householdId={household.id}>
            <ShoppingListView />
        </ShoppingListProvider>
    );
}
