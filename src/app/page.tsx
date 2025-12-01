import { SignInButton } from "@/components/sign-in-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Trophy, Zap, Gamepad2, Gift } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function Home() {
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
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-16 max-w-6xl mx-auto w-full">
        <div className="space-y-8 max-w-4xl animate-in fade-in slide-in-from-bottom-8 duration-700 pt-10">
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

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full pt-8 pb-20 px-4">
          <FunCard
            icon={<Zap className="w-10 h-10 text-yellow-500" />}
            title="Speed Run Chores"
            description="Race against the clock (and your roommates) to clear the task list."
            delay="delay-100"
          />
          <FunCard
            icon={<Trophy className="w-10 h-10 text-orange-500" />}
            title="Climb the Ranks"
            description="Weekly leaderboards to prove who is the true MVP of the house."
            delay="delay-200"
          />
          <FunCard
            icon={<Gift className="w-10 h-10 text-pink-500" />}
            title="Earn Real Loot"
            description="Trade your hard-earned Gold for custom rewards like 'Pizza Night' or 'Skip a Chore'."
            delay="delay-300"
          />
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
    <Card className={`border-2 border-muted/50 bg-card/50 backdrop-blur-sm hover:bg-card hover:border-primary/50 transition-all duration-300 hover:-translate-y-2 animate-in fade-in slide-in-from-bottom-8 ${delay}`}>
      <CardHeader className="flex flex-col items-center space-y-4 pb-2">
        <div className="p-4 bg-background rounded-full shadow-sm ring-1 ring-border">
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
