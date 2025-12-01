import { prisma } from "@/lib/prisma";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy } from "lucide-react";

export async function Leaderboard({ householdId }: { householdId: string }) {
    const members = await prisma.membership.findMany({
        where: { householdId },
        include: {
            user: true,
        },
    });

    // Sort by points descending
    const sortedMembers = members.sort((a: any, b: any) => b.user.totalPoints - a.user.totalPoints);

    return (
        <div className="space-y-4">
            {sortedMembers.map((member: any, index: number) => (
                <div key={member.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="font-bold text-muted-foreground w-4 text-center">
                            {index + 1}
                        </div>
                        <Avatar>
                            <AvatarImage src={member.user.image || ""} />
                            <AvatarFallback>{member.user.name?.[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-medium text-sm leading-none">{member.user.name}</p>
                            <p className="text-xs text-muted-foreground capitalize">{member.role.toLowerCase()}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="font-bold">{member.user.totalPoints}</span>
                        <Trophy className={`w-4 h-4 ${index === 0 ? "text-yellow-500" : "text-muted-foreground"}`} />
                    </div>
                </div>
            ))}
        </div>
    );
}
