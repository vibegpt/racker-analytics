/**
 * ONBOARDING WIZARD
 * 
 * Main controller for the onboarding flow.
 * Manages step state, navigation, and data persistence.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ProgressIndicator, OnboardingStep } from "./ProgressIndicator";
import { StepConnectStripe } from "./StepConnectStripe";
import { StepConnectSocials } from "./StepConnectSocials";
import { StepCreateLink } from "./StepCreateLink";
import { OnboardingComplete } from "./OnboardingComplete";
import { CreditCard, Share2, Link2, CheckCircle2 } from "lucide-react";

// Define the onboarding steps
const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 1,
    title: "Connect Stripe",
    description: "Link your payments",
    icon: <CreditCard className="w-5 h-5" />,
  },
  {
    id: 2,
    title: "Connect Socials",
    description: "Link your accounts",
    icon: <Share2 className="w-5 h-5" />,
  },
  {
    id: 3,
    title: "Create Link",
    description: "Make your first link",
    icon: <Link2 className="w-5 h-5" />,
  },
];

interface OnboardingData {
  stripeConnected: boolean;
  socialAccounts: {
    platform: string;
    username: string;
    displayName?: string;
  }[];
  createdLink?: {
    slug: string;
    originalUrl: string;
    platform: string;
  };
  userName?: string;
}

export function OnboardingWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get step from URL or default to 1
  const stepParam = searchParams.get("step");
  const initialStep = stepParam ? parseInt(stepParam, 10) : 1;
  
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  
  // Onboarding data state
  const [data, setData] = useState<OnboardingData>({
    stripeConnected: false,
    socialAccounts: [],
  });

  // Sync URL step param with state on mount
  useEffect(() => {
    const step = searchParams.get("step");
    if (step) {
      const stepNum = parseInt(step, 10);
      if (stepNum >= 1 && stepNum <= ONBOARDING_STEPS.length) {
        setCurrentStep(stepNum);
      }
    }
    
    // Check for complete param
    if (searchParams.get("complete") === "true") {
      setIsComplete(true);
    }
  }, [searchParams]);

  // Update URL when step changes
  const updateUrl = useCallback((step: number) => {
    const url = new URL(window.location.href);
    url.searchParams.set("step", step.toString());
    // Remove error params when moving forward
    url.searchParams.delete("error");
    router.replace(url.pathname + url.search, { scroll: false });
  }, [router]);

  // Navigation handlers
  const goToStep = (step: number) => {
    if (step >= 1 && step <= ONBOARDING_STEPS.length && !isComplete) {
      setCurrentStep(step);
      updateUrl(step);
    }
  };

  const goNext = () => {
    if (currentStep < ONBOARDING_STEPS.length) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      updateUrl(nextStep);
    } else {
      // Completed all steps - show completion screen
      completeOnboarding();
    }
  };

  const goBack = () => {
    if (currentStep > 1) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      updateUrl(prevStep);
    }
  };

  const skipStep = () => {
    goNext();
  };

  const completeOnboarding = async () => {
    setIsLoading(true);
    
    try {
      // Mark onboarding as complete in database
      const response = await fetch('/api/user/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: true })
      });
      
      if (response.ok) {
        const userData = await response.json();
        setData(prev => ({ ...prev, userName: userData.name }));
      }
      
      // Show completion screen
      setIsComplete(true);
      
      // Update URL
      const url = new URL(window.location.href);
      url.searchParams.set("complete", "true");
      url.searchParams.delete("step");
      router.replace(url.pathname + url.search, { scroll: false });
    } catch (error) {
      console.error("Failed to complete onboarding:", error);
      // Still show completion even if API fails
      setIsComplete(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Show completion screen
  if (isComplete) {
    return <OnboardingComplete userName={data.userName} />;
  }

  // Render current step
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <StepConnectStripe
            onContinue={goNext}
            onSkip={skipStep}
          />
        );
      
      case 2:
        return (
          <StepConnectSocials
            onBack={goBack}
            onContinue={goNext}
            onSkip={skipStep}
            connectedAccounts={data.socialAccounts}
          />
        );
      
      case 3:
        return (
          <StepCreateLink
            onBack={goBack}
            onContinue={goNext}
            createdLink={data.createdLink}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      {/* Progress Indicator */}
      <ProgressIndicator
        steps={ONBOARDING_STEPS}
        currentStep={currentStep}
        onStepClick={goToStep}
      />

      {/* Current Step Content */}
      <div key={currentStep} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {renderStep()}
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Setting up your account...</p>
          </div>
        </div>
      )}
    </div>
  );
}
