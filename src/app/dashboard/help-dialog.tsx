"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HelpCircle, Plane, RefreshCw, Trophy, ShoppingBag, ShoppingCart, Users, Link as LinkIcon } from "lucide-react";

export function HelpDialog() {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                    <HelpCircle className="h-5 w-5" />
                    <span className="sr-only">Help</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="w-[calc(100vw-2rem)] max-w-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                        <HelpCircle className="h-6 w-6 text-primary" />
                        How to use Choreo
                    </DialogTitle>
                    <DialogDescription>
                        Everything you need to know to master your household chores.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 pt-4">
                    {/* Assignment Strategies */}
                    <div className="space-y-2">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <RefreshCw className="h-5 w-5 text-blue-500" />
                            Assignment Strategies
                        </h3>
                        <p className="text-muted-foreground leading-relaxed">
                            Admins can choose how recurring chores are assigned in <strong>Settings</strong>:
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-1">
                            <li><strong>Load Balancing</strong> (Default): Assigns to the person with the least pending chores. Overdue chores count double, and chores sitting longer add to the score. Fast completers may get more work but earn more XP!</li>
                            <li><strong>Strict Rotation</strong>: True equality - cycles through members in order, everyone gets exactly their share.</li>
                            <li><strong>Random</strong>: Picks a random available member.</li>
                            <li><strong>None</strong>: Leaves chores unassigned for first-come-first-serve claiming.</li>
                        </ul>
                    </div>

                    {/* Vacation Mode */}
                    <div className="space-y-2">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Plane className="h-5 w-5 text-orange-500" />
                            Vacation Mode
                        </h3>
                        <p className="text-muted-foreground leading-relaxed">
                            Going away? Turn on <strong>Vacation Mode</strong> in your profile menu.
                            While active, you won't be assigned any new recurring chores.
                            The system will automatically skip you and assign tasks to other available members.
                        </p>
                    </div>

                    {/* XP & Levels */}
                    <div className="space-y-2">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Trophy className="h-5 w-5 text-yellow-500" />
                            XP & Levels
                        </h3>
                        <p className="text-muted-foreground leading-relaxed">
                            Complete chores to earn <strong>XP (Experience Points)</strong>.
                            As you gain XP, you'll level up and unlock cool new titles.
                            Compete with your household to see who can reach the highest level!
                        </p>
                    </div>

                    {/* Rewards */}
                    <div className="space-y-2">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <ShoppingBag className="h-5 w-5 text-purple-500" />
                            Rewards (Economy Mode)
                        </h3>
                        <p className="text-muted-foreground leading-relaxed">
                            If your household uses Economy Mode, you also earn <strong>Gold</strong> for every chore.
                            Use your Gold to redeem rewards in the Shop, like "Skip a Chore" or "Movie Night Pick".
                        </p>
                    </div>

                    {/* Shopping List */}
                    <div className="space-y-2">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <ShoppingCart className="h-5 w-5 text-green-500" />
                            Shopping List
                        </h3>
                        <p className="text-muted-foreground leading-relaxed">
                            Need something from the store? Add it to the <strong>Shopping List</strong>!
                            It's shared with your whole household and updates in real-time.
                            Anyone can check off items as they buy them.
                        </p>
                    </div>

                    {/* Household Chores */}
                    <div className="space-y-2">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Users className="h-5 w-5 text-indigo-500" />
                            Household Chores
                        </h3>
                        <p className="text-muted-foreground leading-relaxed">
                            Curious what others are doing? Click the <strong>Household Chores</strong> button to see everyone's tasks.
                            You can even tap a chore to expand it and see its subtasks!
                        </p>
                    </div>

                    {/* Invite Links */}
                    <div className="space-y-2">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <LinkIcon className="h-5 w-5 text-pink-500" />
                            Invite Members
                        </h3>
                        <p className="text-muted-foreground leading-relaxed">
                            Want to add a roommate? Find the <strong>Invite Code</strong> in your profile menu (tap your avatar).
                            Copy the code or link to send them a direct invite!
                        </p>
                    </div>

                    {/* Tips */}
                    <div className="bg-muted/50 p-4 rounded-lg border">
                        <h4 className="font-semibold mb-2">💡 Pro Tips</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                            <li>Swipe a chore to the right to complete it quickly.</li>
                            <li>Tap on any chore to see its full details and description.</li>
                            <li>Made a mistake? Undo a completed chore within 1 hour from the Activity Feed.</li>
                            <li>Check the Calendar view to plan your week ahead.</li>
                            <li>Use templates when creating chores to save time!</li>
                        </ul>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
