/**
 * STEP 1: CONNECT STRIPE
 * 
 * Stripe Connect OAuth flow for creators to connect their existing accounts.
 */

"use client";

import { useState, useEffect } from "react";
import { StepContainer } from "./StepContainer";
import { Button } from "@/components/ui/button";
import { CreditCard, ExternalLink, CheckCircle2, AlertCircle, Loader2, X } from "lucide-react";

interface StripeAccount {
  id: string;
  businessName?: string | null;
  email?: string | null;
  chargesEnabled?: boolean;
  payoutsEnabled?: boolean;
}

interface StepConnectStripeProps {
  onBack?: () => void;
  onContinue: () => void;
  onSkip?: () => void;
}

export function StepConnectStripe({
  onBack,
  onContinue,
  onSkip,
}: StepConnectStripeProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState<StripeAccount | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check connection status on mount and when returning from OAuth
  useEffect(() => {
    checkConnectionStatus();
    
    // Check for error in URL params
    const params = new URLSearchParams(window.location.search);
    const urlError = params.get("error");
    if (urlError) {
      setError(getErrorMessage(urlError));
      // Clean up URL
      window.history.replaceState({}, "", window.location.pathname + "?step=1");
    }
  }, []);

  const checkConnectionStatus = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/oauth/stripe/status");
      const data = await response.json();
      
      if (response.ok) {
        setIsConnected(data.connected);
        setAccount(data.account);
      }
    } catch (err) {
      console.error("Failed to check Stripe status:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectStripe = () => {
    setIsConnecting(true);
    setError(null);
    // Redirect to OAuth initiation endpoint
    window.location.href = "/api/oauth/stripe?return_url=/onboarding?step=2";
  };

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect your Stripe account?")) {
      return;
    }

    try {
      setIsDisconnecting(true);
      const response = await fetch("/api/oauth/stripe/status", {
        method: "DELETE",
      });

      if (response.ok) {
        setIsConnected(false);
        setAccount(null);
      } else {
        const data = await response.json();
        setError(data.error || "Failed to disconnect");
      }
    } catch (err) {
      setError("Failed to disconnect Stripe account");
    } finally {
      setIsDisconnecting(false);
    }
  };

  const getErrorMessage = (errorCode: string): string => {
    const messages: Record<string, string> = {
      access_denied: "You declined to connect your Stripe account.",
      stripe_init_failed: "Failed to start Stripe connection. Please try again.",
      missing_params: "Invalid response from Stripe. Please try again.",
      invalid_state: "Security check failed. Please try again.",
      state_expired: "Connection request expired. Please try again.",
      user_mismatch: "Account mismatch. Please sign in and try again.",
      callback_failed: "Failed to complete connection. Please try again.",
    };
    return messages[errorCode] || "An error occurred. Please try again.";
  };

  if (isLoading) {
    return (
      <StepContainer
        icon={<CreditCard className="w-8 h-8" />}
        title="Connect Your Stripe Account"
        description="Checking connection status..."
      >
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </StepContainer>
    );
  }

  return (
    <StepContainer
      icon={<CreditCard className="w-8 h-8" />}
      title="Connect Your Stripe Account"
      description="Link your Stripe account so we can track your revenue and attribute sales to your content."
      showBack={!!onBack}
      onBack={onBack}
      continueText={isConnected ? "Continue" : "Skip for now"}
      onContinue={isConnected ? onContinue : onSkip}
      continueDisabled={false}
      showSkip={!isConnected}
      onSkip={onSkip}
    >
      <div className="space-y-6">
        {/* Error Message */}
        {error && (
          <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/5 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-500">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-500/50 hover:text-red-500"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {isConnected && account ? (
          // Connected State
          <div className="p-6 rounded-xl border border-green-500/30 bg-green-500/5">
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-500/10">
                <CheckCircle2 className="w-6 h-6 text-green-500" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-green-500">Stripe Connected!</p>
                <p className="text-sm text-muted-foreground">
                  {account.businessName || account.email || account.id}
                </p>
                {account.chargesEnabled && (
                  <p className="text-xs text-green-600 mt-1">✓ Charges enabled</p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDisconnect}
                disabled={isDisconnecting}
                className="text-muted-foreground hover:text-destructive"
              >
                {isDisconnecting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Disconnect"
                )}
              </Button>
            </div>
          </div>
        ) : (
          // Not Connected State
          <>
            <div className="p-6 rounded-xl border border-dashed border-muted-foreground/30 bg-muted/20">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                  <CreditCard className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground mb-4">
                  No Stripe account connected yet
                </p>
                <Button
                  onClick={handleConnectStripe}
                  disabled={isConnecting}
                  className="gap-2"
                  size="lg"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z"/>
                      </svg>
                      Connect with Stripe
                      <ExternalLink className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Benefits */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { title: "Track Revenue", desc: "See which posts drive sales" },
                { title: "Auto-Attribution", desc: "Match clicks to purchases" },
                { title: "Real-time Data", desc: "Instant sale notifications" },
              ].map((benefit) => (
                <div key={benefit.title} className="p-4 rounded-lg bg-muted/30 text-center">
                  <p className="font-medium text-sm">{benefit.title}</p>
                  <p className="text-xs text-muted-foreground">{benefit.desc}</p>
                </div>
              ))}
            </div>

            {/* Security Note */}
            <p className="text-xs text-center text-muted-foreground">
              🔒 We only request read access to your sales data. We can't transfer funds or make changes to your account.
            </p>
          </>
        )}
      </div>
    </StepContainer>
  );
}
