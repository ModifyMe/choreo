import { SignInButton } from "@/components/sign-in-button";
import { CheckCircle2, Users, Zap } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { FallingEmojis } from "@/components/falling-emojis";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground relative overflow-hidden">
      <FallingEmojis />
      {/* Header */}
      <header className="px-6 py-4 flex justify-between items-center border-b">
        <div className="flex items-center gap-2">
          <span className="font-bold text-xl tracking-tight">Choreo</span>
        </div>
        <nav>
          <SignInButton text="Login" variant="ghost" className="font-medium" />
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-12 max-w-4xl mx-auto w-full">
        <div className="space-y-6">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-primary">
            Household chores, <br className="hidden md:block" />
            simplified.
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            A shared space for your family or roommates to track tasks, earn rewards, and stay organized without the hassle.
          </p>
          <div className="pt-4">
            <SignInButton
              text="Get Started"
              size="lg"
              className="px-8 text-lg font-semibold rounded-full"
            />
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full pt-12 text-left">
          <Feature
            icon={<Users className="w-6 h-6 text-blue-500" />}
            title="Shared Lists"
            description="Everyone sees what needs to be done. No more confusion or nagging."
          />
          <Feature
            icon={<Zap className="w-6 h-6 text-yellow-500" />}
            title="Real-time Sync"
            description="Updates happen instantly across all devices. Always stay in the loop."
          />
          <Feature
            icon={<CheckCircle2 className="w-6 h-6 text-green-500" />}
            title="Rewards System"
            description="Gamify chores with points. Redeem them for real-life rewards."
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-sm text-muted-foreground border-t">
        <p>&copy; {new Date().getFullYear()} Choreo. All rights reserved.</p>
      </footer>
    </div>
  );
}

function Feature({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-6 rounded-xl border bg-card/50 hover:bg-card transition-colors">
      <div className="mb-4">{icon}</div>
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}
