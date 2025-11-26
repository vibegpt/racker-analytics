/**
 * STEP CONTAINER
 * 
 * Consistent wrapper for each onboarding step.
 * Provides title, description, icon, and action buttons.
 */

"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepContainerProps {
  /** Step icon */
  icon: React.ReactNode;
  /** Step title */
  title: string;
  /** Step description */
  description: string;
  /** Main content */
  children: React.ReactNode;
  /** Show back button */
  showBack?: boolean;
  /** Back button handler */
  onBack?: () => void;
  /** Continue button text */
  continueText?: string;
  /** Continue button handler */
  onContinue?: () => void;
  /** Whether continue is disabled */
  continueDisabled?: boolean;
  /** Whether action is in progress */
  isLoading?: boolean;
  /** Optional skip button */
  showSkip?: boolean;
  /** Skip button handler */
  onSkip?: () => void;
  /** Additional footer content */
  footerExtra?: React.ReactNode;
}

export function StepContainer({
  icon,
  title,
  description,
  children,
  showBack = false,
  onBack,
  continueText = "Continue",
  onContinue,
  continueDisabled = false,
  isLoading = false,
  showSkip = false,
  onSkip,
  footerExtra,
}: StepContainerProps) {
  return (
    <Card className="border-0 shadow-2xl ring-1 ring-border/50 bg-card/80 backdrop-blur-sm overflow-hidden">
      {/* Header with gradient accent */}
      <div className="h-1 bg-gradient-to-r from-primary via-primary/80 to-primary/60" />
      
      <CardContent className="p-8">
        {/* Icon and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-4">
            {icon}
          </div>
          <h1 className="text-2xl font-bold mb-2">{title}</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            {description}
          </p>
        </div>

        {/* Main Content */}
        <div className="mb-8">
          {children}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-4">
          <div>
            {showBack && onBack && (
              <Button
                variant="ghost"
                onClick={onBack}
                disabled={isLoading}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {footerExtra}
            
            {showSkip && onSkip && (
              <Button
                variant="ghost"
                onClick={onSkip}
                disabled={isLoading}
                className="text-muted-foreground"
              >
                Skip for now
              </Button>
            )}
            
            {onContinue && (
              <Button
                onClick={onContinue}
                disabled={continueDisabled || isLoading}
                className="gap-2 min-w-[140px]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Please wait...
                  </>
                ) : (
                  <>
                    {continueText}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Simple info card for displaying connected accounts, etc.
 */
export function InfoCard({
  icon,
  title,
  subtitle,
  status,
  onRemove,
  className,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  status?: "connected" | "pending" | "error";
  onRemove?: () => void;
  className?: string;
}) {
  return (
    <div className={cn(
      "flex items-center gap-4 p-4 rounded-xl border bg-muted/30",
      status === "connected" && "border-green-500/30 bg-green-500/5",
      status === "error" && "border-red-500/30 bg-red-500/5",
      className
    )}>
      <div className={cn(
        "flex items-center justify-center w-10 h-10 rounded-lg",
        status === "connected" && "bg-green-500/10 text-green-500",
        status === "error" && "bg-red-500/10 text-red-500",
        !status && "bg-muted text-muted-foreground"
      )}>
        {icon}
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{title}</p>
        {subtitle && (
          <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
        )}
      </div>

      {status === "connected" && (
        <span className="text-xs font-medium text-green-500 bg-green-500/10 px-2 py-1 rounded-full">
          Connected
        </span>
      )}

      {onRemove && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="text-muted-foreground hover:text-destructive"
        >
          Remove
        </Button>
      )}
    </div>
  );
}
