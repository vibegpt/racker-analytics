/**
 * ONBOARDING COMPLETE STEP
 * 
 * Final celebration screen after completing onboarding.
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle2, 
  Sparkles, 
  ArrowRight, 
  Link2, 
  BarChart3, 
  Zap,
  Loader2
} from "lucide-react";

interface OnboardingCompleteProps {
  userName?: string;
}

export function OnboardingComplete({ userName }: OnboardingCompleteProps) {
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Trigger confetti on mount
  useEffect(() => {
    const loadAndFireConfetti = async () => {
      try {
        const confettiModule = await import("canvas-confetti");
        const confetti = confettiModule.default;
        
        const duration = 2000;
        const end = Date.now() + duration;

        const frame = () => {
          confetti({
            particleCount: 3,
            angle: 60,
            spread: 55,
            origin: { x: 0, y: 0.7 },
            colors: ['#8b5cf6', '#a78bfa', '#c4b5fd'],
          });
          confetti({
            particleCount: 3,
            angle: 120,
            spread: 55,
            origin: { x: 1, y: 0.7 },
            colors: ['#8b5cf6', '#a78bfa', '#c4b5fd'],
          });

          if (Date.now() < end) {
            requestAnimationFrame(frame);
          }
        };

        frame();
      } catch {
        // Confetti not installed - skip animation
      }
    };

    loadAndFireConfetti();
  }, []);

  const handleGoToDashboard = () => {
    setIsRedirecting(true);
    router.push("/dashboard?welcome=true");
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Success Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/10 mb-6">
          <CheckCircle2 className="w-10 h-10 text-green-500" />
        </div>
        <h1 className="text-3xl font-bold mb-2">
          You're All Set{userName ? `, ${userName}` : ""}! 🎉
        </h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Your account is ready. Start sharing smart links and watch your revenue attribution come to life.
        </p>
      </div>

      {/* What's Next Card */}
      <Card className="border-0 shadow-2xl ring-1 ring-border/50 bg-card/80 backdrop-blur-sm overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500" />
        <CardContent className="p-8">
          <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            What's Next
          </h2>

          <div className="grid gap-4">
            {[
              {
                icon: Link2,
                title: "Share Your Smart Links",
                description: "Add your rckr.co links to tweets, video descriptions, and posts",
                color: "text-blue-500",
                bg: "bg-blue-500/10",
              },
              {
                icon: BarChart3,
                title: "Track Your Performance",
                description: "Watch clicks and conversions flow into your dashboard",
                color: "text-purple-500",
                bg: "bg-purple-500/10",
              },
              {
                icon: Zap,
                title: "See Revenue Attribution",
                description: "When someone buys, we'll show you exactly which content drove the sale",
                color: "text-amber-500",
                bg: "bg-amber-500/10",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="flex items-start gap-4 p-4 rounded-xl bg-muted/30"
              >
                <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${item.bg}`}>
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <Button
            onClick={handleGoToDashboard}
            disabled={isRedirecting}
            className="w-full h-12 mt-8 gap-2"
            size="lg"
          >
            {isRedirecting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Loading Dashboard...
              </>
            ) : (
              <>
                Go to Dashboard
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Quick Tips */}
      <div className="text-center text-sm text-muted-foreground">
        <p>
          💡 Pro tip: Create different links for different platforms to see which converts best
        </p>
      </div>
    </div>
  );
}