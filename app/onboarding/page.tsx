/**
 * ONBOARDING PAGE
 * 
 * Entry point for the onboarding flow.
 * Wraps the wizard in Suspense for URL search params.
 */

import { Suspense } from "react";
import { OnboardingWizard } from "@/components/onboarding";

// Loading skeleton for the wizard
function OnboardingLoading() {
  return (
    <div className="space-y-8">
      {/* Progress skeleton */}
      <div className="flex items-center justify-between">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center flex-1">
            <div className="w-12 h-12 rounded-full bg-muted animate-pulse" />
            {i < 3 && <div className="flex-1 mx-4 h-0.5 bg-muted" />}
          </div>
        ))}
      </div>

      {/* Card skeleton */}
      <div className="rounded-xl border bg-card p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-muted animate-pulse mb-4" />
          <div className="h-8 w-64 bg-muted rounded animate-pulse mb-2" />
          <div className="h-4 w-80 bg-muted rounded animate-pulse" />
        </div>
        <div className="space-y-4">
          <div className="h-32 bg-muted rounded-xl animate-pulse" />
          <div className="h-12 bg-muted rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<OnboardingLoading />}>
      <OnboardingWizard />
    </Suspense>
  );
}
