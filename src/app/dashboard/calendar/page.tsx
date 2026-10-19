import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CalendarView } from "./calendar-view";

export default async function CalendarPage() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) redirect("/api/auth/signin");

    // The shared dashboard layout supplies the header and selected household's chores.
    return <CalendarView userId={session.user.id} />;
}
