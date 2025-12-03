import { SignInButton } from "@/components/sign-in-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Trophy, Zap, Gamepad2, Gift, Camera, Plane, Coins, UserPlus, CheckSquare } from "lucide-react";

export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-400/20 via-background to-background flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 flex justify-between items-center border-b bg-background/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="bg-primary p-2 rounded-xl shadow-lg shadow-primary/20 rotate-3 transition-transform hover:rotate-0">
            <Gamepad2 className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="font-extrabold text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
            Choreo
          </span>
        </div>
        <nav>
          <SignInButton text="Login" variant="ghost" className="font-semibold" />
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center p-6 text-center space-y-24 max-w-6xl mx-auto w-full">

        {/* Hero */}
        <div className="space-y-8 max-w-4xl animate-in fade-in slide-in-from-bottom-8 duration-700 pt-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm mb-4 animate-bounce">
            <Sparkles className="w-4 h-4" />
            <span>Gamify your household today!</span>
          </div>

          <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-tight">
            Chores? <br className="md:hidden" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
              More like Quests.
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Stop the nagging. Start the grinding. <br />
            Turn dishwashing into <span className="font-bold text-foreground">XP</span> and trash duty into <span className="font-bold text-foreground">Gold</span>.
          </p>

          <div className="pt-8 transform hover:scale-105 transition-transform duration-200">
            <SignInButton
              text="Start Your Adventure"
              size="lg"
              className="h-16 px-10 text-xl font-bold rounded-full shadow-xl shadow-primary/30 hover:shadow-primary/50 transition-all bg-gradient-to-r from-primary to-purple-600 border-0"
            />
            <p className="text-sm text-muted-foreground mt-4">
              Free to join • No credit card required
            </p>
          </div>
        </div>

        {/* How to Play (Steps) */}
        <div className="w-full space-y-12">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight">How to Play</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <StepCard
              number="1"
              icon={<UserPlus className="w-6 h-6" />}
              title="Form Your Party"
              description="Create a household and invite your roommates or family."
            />
            <StepCard
              number="2"
              icon={<CheckSquare className="w-6 h-6" />}
              title="Post Quests"
              description="Add chores with point values and gold rewards."
            />
            <StepCard
              number="3"
              icon={<Camera className="w-6 h-6" />}
              title="Prove It"
              description="Snap a photo proof to complete the task. No cheating!"
            />
            <StepCard
              number="4"
              icon={<Gift className="w-6 h-6" />}
              title="Get Loot"
              description="Redeem gold for real-life rewards like 'Pizza Night'."
            />
          </div>
        </div>

        {/* Features Grid */}
        <div className="w-full space-y-12 pb-20">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Epic Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
            <FunCard
              icon={<Zap className="w-10 h-10 text-yellow-500" />}
              title="Speed Run Chores"
              description="Race against the clock. Recurring tasks keep the XP flowing daily."
              delay="delay-100"
            />
            <FunCard
              icon={<Trophy className="w-10 h-10 text-orange-500" />}
              title="Leaderboards"
              description="Weekly rankings to prove who is the true MVP of the house."
              delay="delay-200"
            />
            <FunCard
              icon={<Plane className="w-10 h-10 text-blue-500" />}
              title="Vacation Mode"
              description="Going AFK? Toggle vacation mode to skip auto-assigned tasks."
              delay="delay-300"
            />
            <FunCard
              icon={<Camera className="w-10 h-10 text-purple-500" />}
              title="Photo Proof"
              description="Pics or it didn't happen. Upload evidence to claim your points."
              delay="delay-100"
            />
            <FunCard
              icon={<Coins className="w-10 h-10 text-green-500" />}
              title="Economy Mode"
              description="Inflation hitting hard? Limit snack rewards to save money."
              delay="delay-200"
            />
            <FunCard
              icon={<Sparkles className="w-10 h-10 text-pink-500" />}
              title="Confetti"
              description="Because finishing the laundry deserves a celebration."
              delay="delay-300"
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-sm text-muted-foreground border-t bg-muted/20">
        <p className="flex items-center justify-center gap-2">
          Built with <span className="text-red-500">♥</span> for cleaner homes everywhere.
        </p>
      </footer>
    </div>
  );
}

function FunCard({ icon, title, description, delay }: { icon: React.ReactNode, title: string, description: string, delay: string }) {
  return (
    <Card className={`border-2 border-muted/50 bg-card/50 backdrop-blur-sm hover:bg-card hover:border-primary/50 transition-all duration-300 hover:-translate-y-2 group`}>
      <CardHeader className="flex flex-col items-center space-y-4 pb-2">
        <div className="p-4 bg-background rounded-full shadow-sm ring-1 ring-border group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
        <CardTitle className="text-xl font-bold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground leading-relaxed">
          {description}
        </p>
      </CardContent>
    </Card>
  )
}

function StepCard({ number, icon, title, description }: { number: string, icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="flex flex-col items-center space-y-4 p-6 rounded-2xl bg-muted/30 border border-transparent hover:border-primary/20 transition-colors">
      <div className="relative">
        <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl shadow-lg z-10 relative">
          {number}
        </div>
        <div className="absolute -top-2 -right-2 bg-background p-1.5 rounded-full shadow-sm text-muted-foreground">
          {icon}
        </div>
      </div>
      <h3 className="font-bold text-lg">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}
