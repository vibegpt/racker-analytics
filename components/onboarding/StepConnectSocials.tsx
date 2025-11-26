/**
 * STEP 2: CONNECT SOCIALS
 * 
 * OAuth flow for connecting social accounts (Twitter, YouTube, etc.)
 */

"use client";

import { useState, useEffect } from "react";
import { StepContainer, InfoCard } from "./StepContainer";
import { Button } from "@/components/ui/button";
import { 
  Share2, 
  Youtube, 
  Instagram, 
  CheckCircle2, 
  Plus, 
  Loader2,
  AlertCircle,
  X
} from "lucide-react";

// Twitter/X icon component
function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}

interface SocialAccount {
  id: string;
  platform: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  followerCount?: number;
  isVerified?: boolean;
}

interface StepConnectSocialsProps {
  onBack: () => void;
  onContinue: () => void;
  onSkip?: () => void;
  connectedAccounts?: SocialAccount[];
}

const SOCIAL_PLATFORMS = [
  {
    id: "youtube",
    name: "YouTube",
    icon: Youtube,
    color: "bg-red-500",
    description: "Track videos and comments",
    available: true,
  },
  {
    id: "twitter",
    name: "Twitter / X",
    icon: TwitterIcon,
    color: "bg-black",
    description: "Track tweets and replies",
    available: false, // Requires paid API
    comingSoon: false,
    requiresPaid: true,
  },
  {
    id: "instagram",
    name: "Instagram",
    icon: Instagram,
    color: "bg-pink-500",
    description: "Track posts and stories",
    available: false,
    comingSoon: true,
  },
];

export function StepConnectSocials({
  onBack,
  onContinue,
  onSkip,
}: StepConnectSocialsProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState<string | null>(null);
  const [isDisconnecting, setIsDisconnecting] = useState<string | null>(null);
  const [connectedAccounts, setConnectedAccounts] = useState<SocialAccount[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Check for connected accounts and URL params on mount
  useEffect(() => {
    fetchConnectedAccounts();
    
    // Check for success/error in URL params
    const params = new URLSearchParams(window.location.search);
    const success = params.get("success");
    const platform = params.get("platform");
    const urlError = params.get("error");
    
    if (success === "connected" && platform) {
      // Refresh accounts after successful connection
      fetchConnectedAccounts();
      // Clean up URL
      const cleanUrl = window.location.pathname + "?step=2";
      window.history.replaceState({}, "", cleanUrl);
    }
    
    if (urlError) {
      setError(getErrorMessage(urlError));
      // Clean up URL
      const cleanUrl = window.location.pathname + "?step=2";
      window.history.replaceState({}, "", cleanUrl);
    }
  }, []);

  const fetchConnectedAccounts = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/social-accounts");
      
      if (response.ok) {
        const data = await response.json();
        setConnectedAccounts(data.accounts || []);
      }
    } catch (err) {
      console.error("Failed to fetch social accounts:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectPlatform = (platformId: string) => {
    setIsConnecting(platformId);
    setError(null);
    // Redirect to OAuth initiation endpoint
    window.location.href = `/api/oauth/${platformId}?return_url=/onboarding?step=2`;
  };

  const handleDisconnect = async (platformId: string) => {
    if (!confirm(`Disconnect your ${platformId} account?`)) {
      return;
    }

    try {
      setIsDisconnecting(platformId);
      const response = await fetch(`/api/social-accounts?platform=${platformId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setConnectedAccounts(prev => 
          prev.filter(acc => acc.platform.toLowerCase() !== platformId)
        );
      } else {
        const data = await response.json();
        setError(data.error || "Failed to disconnect");
      }
    } catch (err) {
      setError("Failed to disconnect account");
    } finally {
      setIsDisconnecting(null);
    }
  };

  const getErrorMessage = (errorCode: string): string => {
    const messages: Record<string, string> = {
      access_denied: "You declined to connect your account.",
      not_configured: "This platform is not configured yet.",
      missing_params: "Invalid response. Please try again.",
      invalid_state: "Security check failed. Please try again.",
      oauth_failed: "Connection failed. Please try again.",
    };
    return messages[errorCode] || "An error occurred. Please try again.";
  };

  const isAccountConnected = (platformId: string) => {
    return connectedAccounts.some(
      acc => acc.platform.toLowerCase() === platformId
    );
  };

  const getConnectedAccount = (platformId: string) => {
    return connectedAccounts.find(
      acc => acc.platform.toLowerCase() === platformId
    );
  };

  const hasConnectedAccount = connectedAccounts.length > 0;

  if (isLoading) {
    return (
      <StepContainer
        icon={<Share2 className="w-8 h-8" />}
        title="Connect Your Social Accounts"
        description="Checking connected accounts..."
        showBack
        onBack={onBack}
      >
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </StepContainer>
    );
  }

  return (
    <StepContainer
      icon={<Share2 className="w-8 h-8" />}
      title="Connect Your Social Accounts"
      description="Link your social media accounts so we can track your posts and correlate engagement with revenue."
      showBack
      onBack={onBack}
      continueText={hasConnectedAccount ? "Continue" : "Skip for now"}
      onContinue={hasConnectedAccount ? onContinue : onSkip}
      showSkip={!hasConnectedAccount}
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

        {/* Connected Accounts */}
        {connectedAccounts.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">Connected Accounts</p>
            {connectedAccounts.map((account) => {
              const platform = SOCIAL_PLATFORMS.find(
                p => p.id === account.platform.toLowerCase()
              );
              const Icon = platform?.icon || Share2;
              
              return (
                <div
                  key={account.id}
                  className="flex items-center gap-4 p-4 rounded-xl border border-green-500/30 bg-green-500/5"
                >
                  <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${platform?.color || 'bg-gray-500'} text-white`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {account.displayName || account.username}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {account.username}
                      {account.followerCount && (
                        <span className="ml-2">• {account.followerCount.toLocaleString()} followers</span>
                      )}
                    </p>
                  </div>

                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDisconnect(account.platform.toLowerCase())}
                    disabled={isDisconnecting === account.platform.toLowerCase()}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    {isDisconnecting === account.platform.toLowerCase() ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Disconnect"
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        {/* Available Platforms */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">
            {connectedAccounts.length > 0 ? "Connect More" : "Choose a Platform"}
          </p>
          
          <div className="grid gap-3">
            {SOCIAL_PLATFORMS.map((platform) => {
              const isConnected = isAccountConnected(platform.id);
              const Icon = platform.icon;

              if (isConnected) return null; // Don't show connected platforms here

              return (
                <div
                  key={platform.id}
                  className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                    !platform.available
                      ? "opacity-50 cursor-not-allowed"
                      : "border-border hover:border-primary/50 hover:bg-muted/30 cursor-pointer"
                  }`}
                  onClick={() => platform.available && !isConnecting && handleConnectPlatform(platform.id)}
                >
                  <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${platform.color} text-white`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  
                  <div className="flex-1">
                    <p className="font-medium">{platform.name}</p>
                    <p className="text-sm text-muted-foreground">{platform.description}</p>
                  </div>

                  {platform.comingSoon ? (
                    <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-full">
                      Coming Soon
                    </span>
                  ) : platform.requiresPaid ? (
                    <span className="text-xs font-medium text-amber-600 bg-amber-500/10 px-2 py-1 rounded-full">
                      Paid API Required
                    </span>
                  ) : (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="gap-1"
                      disabled={isConnecting === platform.id}
                    >
                      {isConnecting === platform.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          Connect
                        </>
                      )}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Help Text */}
        <p className="text-xs text-center text-muted-foreground">
          We only request read access to track your public content. We never post on your behalf.
        </p>
      </div>
    </StepContainer>
  );
}
