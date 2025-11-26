/**
 * ONBOARDING LAYOUT
 * 
 * Clean layout for onboarding flow - no sidebar, centered content.
 * Includes Clerk auth check and Racker branding.
 */

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { Zap } from "lucide-react";

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  // Redirect to sign-in if not authenticated
  if (!userId) {
    redirect("/sign-in");
  }

  // Check if user exists and has completed onboarding
  const user = await db.user.findUnique({
    where: { clerkId: userId },
    select: {
      onboardingCompleted: true,
    },
  });

  // If user has explicitly completed onboarding, redirect to dashboard
  if (user?.onboardingCompleted) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full group-hover:bg-primary/30 transition-colors" />
              <div className="relative bg-primary text-primary-foreground p-2 rounded-xl">
                <Zap className="w-5 h-5" />
              </div>
            </div>
            <span className="font-bold text-xl">Racker</span>
          </Link>
          
          <div className="text-sm text-muted-foreground">
            Need help? <a href="/docs" className="text-primary hover:underline">View docs</a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-3xl">
          {children}
        </div>
      </main>

      {/* Subtle background decoration */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-primary/5 rounded-full blur-3xl" />
      </div>
    </div>
  );
}
