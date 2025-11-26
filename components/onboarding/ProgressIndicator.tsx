/**
 * PROGRESS INDICATOR
 * 
 * Visual step progress for onboarding wizard.
 * Shows completed, current, and upcoming steps.
 */

"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface ProgressIndicatorProps {
  steps: OnboardingStep[];
  currentStep: number;
  onStepClick?: (step: number) => void;
}

export function ProgressIndicator({ 
  steps, 
  currentStep, 
  onStepClick 
}: ProgressIndicatorProps) {
  return (
    <div className="w-full mb-8">
      {/* Desktop: Horizontal */}
      <div className="hidden md:flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          const isClickable = onStepClick && (isCompleted || isCurrent);

          return (
            <div key={step.id} className="flex-1 flex items-center">
              {/* Step Circle */}
              <button
                onClick={() => isClickable && onStepClick?.(step.id)}
                disabled={!isClickable}
                className={cn(
                  "relative flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300",
                  isCompleted && "bg-primary border-primary text-primary-foreground",
                  isCurrent && "border-primary bg-primary/10 text-primary",
                  !isCompleted && !isCurrent && "border-muted-foreground/30 text-muted-foreground/50",
                  isClickable && "cursor-pointer hover:scale-105",
                  !isClickable && "cursor-default"
                )}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span className="text-sm font-semibold">{step.id}</span>
                )}
                
                {/* Pulse animation for current step */}
                {isCurrent && (
                  <span className="absolute inset-0 rounded-full border-2 border-primary animate-ping opacity-20" />
                )}
              </button>

              {/* Step Label */}
              <div className="ml-3 hidden lg:block">
                <p className={cn(
                  "text-sm font-medium",
                  isCurrent && "text-foreground",
                  !isCurrent && "text-muted-foreground"
                )}>
                  {step.title}
                </p>
                <p className="text-xs text-muted-foreground/70">
                  {step.description}
                </p>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="flex-1 mx-4">
                  <div className={cn(
                    "h-0.5 rounded-full transition-colors duration-300",
                    currentStep > step.id ? "bg-primary" : "bg-muted-foreground/20"
                  )} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile: Vertical with current step highlighted */}
      <div className="md:hidden">
        <div className="flex items-center justify-center gap-2 mb-4">
          {steps.map((step) => (
            <div
              key={step.id}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-300",
                currentStep === step.id && "w-8 bg-primary",
                currentStep > step.id && "bg-primary",
                currentStep < step.id && "bg-muted-foreground/30"
              )}
            />
          ))}
        </div>
        
        {/* Current Step Info */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Step {currentStep} of {steps.length}
          </p>
          <p className="text-lg font-semibold">
            {steps.find(s => s.id === currentStep)?.title}
          </p>
        </div>
      </div>
    </div>
  );
}
