import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Sparkles, Trophy, Users } from "lucide-react";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/50 flex flex-col">
      <header className="px-6 py-4 flex justify-between items-center border-b bg-background/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="bg-primary p-2 rounded-lg">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-xl tracking-tight">Choreo</span>
        </div>
        <nav>
          <Link href="/api/auth/signin">
            <Button>Sign In</Button>
          </Link>
        </nav>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-12 max-w-5xl mx-auto w-full">
        <div className="space-y-6 max-w-3xl animate-in fade-in slide-in-from-bottom-8 duration-700">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter">
            Gamify your <span className="text-primary">chores</span>.
            <br />
            Master your <span className="text-primary">household</span>.
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Stop fighting over dishes. Choreo turns household tasks into a friendly competition.
            Earn points, climb the leaderboard, and get things done.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link href="/api/auth/signin">
              <Button size="lg" className="h-12 px-8 text-lg rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all">
                Get Started for Free
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="h-12 px-8 text-lg rounded-full">
              View Demo
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full pt-12 animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-200">
          <FeatureCard
            icon={<Users className="w-8 h-8 text-blue-500" />}
            title="Team Up"
            description="Create a household and invite your roommates or family members instantly."
          />
          <FeatureCard
            icon={<CheckCircle2 className="w-8 h-8 text-green-500" />}
            title="Track Tasks"
            description="Post chores, assign them, or let anyone claim them from the pool."
          />
          <FeatureCard
            icon={<Trophy className="w-8 h-8 text-yellow-500" />}
            title="Compete & Win"
            description="Earn XP for every task. Weekly leaderboards keep everyone motivated."
          />
        </div>
      </main>

      <footer className="py-8 text-center text-sm text-muted-foreground border-t">
        <p>© {new Date().getFullYear()} Choreo. Built for cleaner homes.</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <Card className="border-none shadow-md bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-colors">
      <CardHeader>
        <div className="mb-2">{icon}</div>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-base">{description}</CardDescription>
      </CardContent>
    </Card>
  )
}
