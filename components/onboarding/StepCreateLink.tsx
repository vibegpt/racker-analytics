/**
 * STEP 3: CREATE FIRST LINK
 * 
 * Form to create the user's first smart link during onboarding.
 */

"use client";

import { useState } from "react";
import { StepContainer } from "./StepContainer";
import { Button } from "@/components/ui/button";
import { 
  Link2, 
  Sparkles, 
  Youtube, 
  Instagram,
  Globe,
  Copy,
  Check,
  Loader2,
  AlertCircle,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

// Twitter/X icon component
function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}

interface CreatedLink {
  id: string;
  slug: string;
  originalUrl: string;
  platform: string;
  shortUrl: string;
}

interface StepCreateLinkProps {
  onBack: () => void;
  onContinue: () => void;
  createdLink?: CreatedLink;
}

const PLATFORMS = [
  { id: "TWITTER", name: "Twitter", icon: TwitterIcon, color: "bg-black" },
  { id: "YOUTUBE", name: "YouTube", icon: Youtube, color: "bg-red-500" },
  { id: "INSTAGRAM", name: "Instagram", icon: Instagram, color: "bg-pink-500" },
  { id: "OTHER", name: "Other", icon: Globe, color: "bg-gray-500" },
];

export function StepCreateLink({
  onBack,
  onContinue,
  createdLink: initialLink,
}: StepCreateLinkProps) {
  const [destinationUrl, setDestinationUrl] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState("TWITTER");
  const [createdLink, setCreatedLink] = useState<CreatedLink | null>(initialLink || null);
  const [isCreating, setIsCreating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateLink = async () => {
    if (!destinationUrl) {
      setError("Please enter a destination URL");
      return;
    }

    // Basic URL validation
    try {
      new URL(destinationUrl);
    } catch {
      setError("Please enter a valid URL (including https://)");
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const response = await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalUrl: destinationUrl,
          platform: selectedPlatform,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create link");
      }

      setCreatedLink({
        id: data.link.id,
        slug: data.link.slug,
        originalUrl: data.link.originalUrl,
        platform: data.link.platform,
        shortUrl: data.shortUrl,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create link");
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopy = async () => {
    if (!createdLink) return;
    
    try {
      await navigator.clipboard.writeText(`https://${createdLink.shortUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = `https://${createdLink.shortUrl}`;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCreateAnother = () => {
    setCreatedLink(null);
    setDestinationUrl("");
    setError(null);
  };

  const hasLink = !!createdLink;

  return (
    <StepContainer
      icon={<Link2 className="w-8 h-8" />}
      title="Create Your First Smart Link"
      description="Generate a trackable link for your Stripe checkout, product page, or any destination."
      showBack
      onBack={onBack}
      continueText="Finish Setup"
      onContinue={onContinue}
      continueDisabled={!hasLink}
      isLoading={isCreating}
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

        {!hasLink ? (
          <>
            {/* Destination URL Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Destination URL</label>
              <input
                type="text"
                placeholder="https://buy.stripe.com/your-checkout..."
                value={destinationUrl}
                onChange={(e) => setDestinationUrl(e.target.value)}
                className="h-12 w-full px-3 rounded-md border border-input bg-background text-sm"
                disabled={isCreating}
              />
              <p className="text-xs text-muted-foreground">
                Paste your Stripe checkout URL, Gumroad link, or any destination
              </p>
            </div>

            {/* Platform Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Where will you share this?</label>
              <div className="grid grid-cols-4 gap-2">
                {PLATFORMS.map((platform) => {
                  const Icon = platform.icon;
                  const isSelected = selectedPlatform === platform.id;
                  
                  return (
                    <button
                      key={platform.id}
                      type="button"
                      onClick={() => setSelectedPlatform(platform.id)}
                      disabled={isCreating}
                      className={cn(
                        "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all",
                        isSelected
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50",
                        isCreating && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <div className={cn(
                        "flex items-center justify-center w-10 h-10 rounded-lg text-white",
                        platform.color
                      )}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-medium">{platform.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Generate Button */}
            <Button
              type="button"
              onClick={handleCreateLink}
              disabled={!destinationUrl || isCreating}
              className="w-full h-12 gap-2"
              size="lg"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate Smart Link
                </>
              )}
            </Button>
          </>
        ) : (
          /* Link Created State */
          <div className="space-y-6">
            <div className="p-6 rounded-xl border border-green-500/30 bg-green-500/5">
              <div className="text-center mb-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-500/10 mb-3">
                  <Check className="w-6 h-6 text-green-500" />
                </div>
                <p className="font-semibold text-green-500">Link Created!</p>
              </div>

              {/* Generated Link Display */}
              <div className="flex items-center gap-2 p-3 rounded-lg bg-background border">
                <Link2 className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                <code className="flex-1 text-sm font-mono truncate">
                  https://{createdLink.shortUrl}
                </code>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCopy}
                  className="flex-shrink-0"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>

              {/* Original URL */}
              <p className="text-xs text-muted-foreground text-center mt-3 truncate">
                Redirects to: {createdLink.originalUrl}
              </p>
            </div>

            {/* What's Next */}
            <div className="p-4 rounded-lg bg-muted/30">
              <p className="text-sm font-medium mb-2">What happens next?</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Share this link in your tweets, videos, or posts</li>
                <li>• We'll track every click automatically</li>
                <li>• When someone buys, we'll attribute it to your content</li>
              </ul>
            </div>

            {/* Create Another */}
            <Button
              variant="outline"
              onClick={handleCreateAnother}
              className="w-full"
            >
              Create Another Link
            </Button>
          </div>
        )}
      </div>
    </StepContainer>
  );
}
