/**
 * PRODUCT CARD WITH PLATFORM BUTTONS
 *
 * Displays a product with one-click platform buttons.
 * Each click generates a unique link for per-post attribution.
 */
"use client";

import { useState } from "react";
import {
  Copy,
  Check,
  ExternalLink,
  Loader2,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Youtube,
  Instagram,
  Globe,
  Mail,
  MessageCircle,
  Gamepad2,
  MoreHorizontal,
  Link2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SHORT_DOMAIN } from "@/lib/config";

// Twitter/X icon
function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

// TikTok icon
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
    </svg>
  );
}

const PLATFORMS = [
  { id: "TWITTER", name: "Twitter", icon: TwitterIcon, color: "bg-black hover:bg-gray-800", shortCode: "tw" },
  { id: "YOUTUBE", name: "YouTube", icon: Youtube, color: "bg-red-600 hover:bg-red-700", shortCode: "yt" },
  { id: "INSTAGRAM", name: "Instagram", icon: Instagram, color: "bg-gradient-to-br from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600", shortCode: "ig" },
  { id: "TIKTOK", name: "TikTok", icon: TikTokIcon, color: "bg-black hover:bg-gray-800", shortCode: "tt" },
  { id: "TWITCH", name: "Twitch", icon: Gamepad2, color: "bg-purple-600 hover:bg-purple-700", shortCode: "tv" },
  { id: "NEWSLETTER", name: "Newsletter", icon: Mail, color: "bg-blue-600 hover:bg-blue-700", shortCode: "nl" },
  { id: "DISCORD", name: "Discord", icon: MessageCircle, color: "bg-indigo-600 hover:bg-indigo-700", shortCode: "dc" },
  { id: "OTHER", name: "Other", icon: MoreHorizontal, color: "bg-gray-600 hover:bg-gray-700", shortCode: "ot" },
];

interface SmartLink {
  id: string;
  slug: string;
  platform: string;
  linkNumber: number;
  createdAt: string;
  _count: {
    clicks: number;
  };
}

interface Product {
  id: string;
  name: string;
  shortCode: string;
  destinationUrl: string;
  routerType: string;
  active: boolean;
  createdAt: string;
  links: SmartLink[];
  totalClicks: number;
  platformCounts: Record<string, number>;
  _count: {
    links: number;
  };
}

interface ProductCardProps {
  product: Product;
  onLinkGenerated?: (product: Product, link: any) => void;
}

export function ProductCard({ product, onLinkGenerated }: ProductCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showBioLinks, setShowBioLinks] = useState(false);
  const [generatingPlatform, setGeneratingPlatform] = useState<string | null>(null);
  const [generatingBioPlatform, setGeneratingBioPlatform] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [lastGeneratedLink, setLastGeneratedLink] = useState<{ platform: string; url: string; type: string } | null>(null);
  const [bioLinks, setBioLinks] = useState<Record<string, string>>({});

  const generateLink = async (platform: string, type: "post" | "bio" = "post") => {
    if (type === "bio") {
      setGeneratingBioPlatform(platform);
    } else {
      setGeneratingPlatform(platform);
    }
    setLastGeneratedLink(null);

    try {
      const response = await fetch(`/api/products/${product.id}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, type }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate link");
      }

      // Show the generated link
      setLastGeneratedLink({
        platform,
        url: data.shortUrl,
        type: type,
      });

      // For bio links, store in bioLinks state
      if (type === "bio") {
        setBioLinks((prev) => ({ ...prev, [platform]: data.shortUrl }));
      }

      // Copy to clipboard automatically
      await copyToClipboard(data.shortUrl);

      // Notify parent (only for post links, bio links are get-or-create)
      if (onLinkGenerated && type === "post") {
        onLinkGenerated(product, data.link);
      }
    } catch (error) {
      console.error("Failed to generate link:", error);
    } finally {
      setGeneratingPlatform(null);
      setGeneratingBioPlatform(null);
    }
  };

  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(url);
      setTimeout(() => setCopiedLink(null), 3000);
    } catch {
      // Fallback
      const textArea = document.createElement("textarea");
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopiedLink(url);
      setTimeout(() => setCopiedLink(null), 3000);
    }
  };

  const getPlatformConfig = (platformId: string) => {
    return PLATFORMS.find((p) => p.id === platformId) || PLATFORMS[PLATFORMS.length - 1];
  };

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b bg-card">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate">{product.name}</h3>
            <p className="text-sm text-muted-foreground truncate mt-1">
              {product.destinationUrl}
            </p>
          </div>
          <div className="flex items-center gap-4 ml-4">
            <div className="text-right">
              <p className="text-2xl font-bold">{product.totalClicks.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">total clicks</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{product._count.links}</p>
              <p className="text-xs text-muted-foreground">links</p>
            </div>
          </div>
        </div>

        {/* Platform Counts Summary */}
        {Object.keys(product.platformCounts).length > 0 && (
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {Object.entries(product.platformCounts).map(([platform, count]) => {
              const config = getPlatformConfig(platform);
              const Icon = config.icon;
              return (
                <span
                  key={platform}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-muted text-xs"
                >
                  <Icon className="w-3 h-3" />
                  {count}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Platform Buttons */}
      <div className="p-4">
        <p className="text-sm text-muted-foreground mb-3">
          Click a platform to generate a unique tracking link:
        </p>
        <div className="grid grid-cols-4 gap-3">
          {PLATFORMS.map((platform) => {
            const Icon = platform.icon;
            const isGenerating = generatingPlatform === platform.id;
            const count = product.platformCounts[platform.id] || 0;

            return (
              <button
                key={platform.id}
                onClick={() => generateLink(platform.id)}
                disabled={isGenerating || !!generatingPlatform}
                className={cn(
                  "relative flex flex-col items-center gap-1.5 p-3 rounded-xl text-white transition-all",
                  platform.color,
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
                title={`Generate ${platform.name} link`}
              >
                {isGenerating ? (
                  <Loader2 className="w-7 h-7 animate-spin" />
                ) : (
                  <Icon className="w-7 h-7" />
                )}
                <span className="text-xs font-medium">{platform.name}</span>
                {count > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Bio Links Toggle */}
        <div className="mt-4 border-t pt-4">
          <button
            onClick={() => setShowBioLinks(!showBioLinks)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Link2 className="w-4 h-4" />
            <span>Bio Links (permanent per-platform)</span>
            {showBioLinks ? (
              <ChevronUp className="w-4 h-4 ml-auto" />
            ) : (
              <ChevronDown className="w-4 h-4 ml-auto" />
            )}
          </button>

          {showBioLinks && (
            <div className="mt-3">
              <p className="text-xs text-muted-foreground mb-2">
                Get a permanent link for your bio. Same link every time - tracks all clicks from that platform.
              </p>
              <div className="grid grid-cols-4 gap-3">
                {PLATFORMS.map((platform) => {
                  const Icon = platform.icon;
                  const isGenerating = generatingBioPlatform === platform.id;
                  const hasBioLink = bioLinks[platform.id];

                  return (
                    <button
                      key={platform.id}
                      onClick={() => generateLink(platform.id, "bio")}
                      disabled={isGenerating || !!generatingBioPlatform}
                      className={cn(
                        "relative flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all border-2",
                        hasBioLink
                          ? "border-green-500/50 bg-green-500/10"
                          : "border-dashed border-muted-foreground/30 hover:border-muted-foreground/50",
                        "disabled:opacity-50 disabled:cursor-not-allowed"
                      )}
                      title={`Get ${platform.name} bio link`}
                    >
                      {isGenerating ? (
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                      ) : (
                        <Icon className={cn("w-6 h-6", hasBioLink ? "text-green-500" : "text-muted-foreground")} />
                      )}
                      <span className="text-xs text-muted-foreground">{platform.name}</span>
                      {hasBioLink && (
                        <Check className="absolute -top-1.5 -right-1.5 w-4 h-4 text-green-500" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Last Generated Link */}
        {lastGeneratedLink && (
          <div className="mt-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                <code className="text-sm font-mono truncate">{lastGeneratedLink.url}</code>
                {lastGeneratedLink.type === "bio" && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">BIO</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(lastGeneratedLink.url)}
                  className="h-8"
                >
                  {copiedLink === lastGeneratedLink.url ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
                <a
                  href={lastGeneratedLink.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 hover:bg-muted rounded"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Copied to clipboard! {lastGeneratedLink.type === "bio"
                ? `Add to your ${getPlatformConfig(lastGeneratedLink.platform).name} bio.`
                : `Paste in your ${getPlatformConfig(lastGeneratedLink.platform).name} post.`}
            </p>
          </div>
        )}
      </div>

      {/* Expandable Links History */}
      {product.links.length > 0 && (
        <div className="border-t">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
          >
            <span className="text-sm text-muted-foreground">
              View recent links ({product.links.length})
            </span>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </button>

          {isExpanded && (
            <div className="px-4 pb-4">
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {product.links.slice(0, 10).map((link) => {
                  const config = getPlatformConfig(link.platform);
                  const Icon = config.icon;
                  const shortUrl = `https://${SHORT_DOMAIN}/${link.slug}`;

                  return (
                    <div
                      key={link.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-muted/50 text-sm"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className={cn("p-1.5 rounded", config.color.split(" ")[0])}>
                          <Icon className="w-3 h-3 text-white" />
                        </div>
                        <code className="font-mono text-xs truncate">{link.slug}</code>
                        <span className="text-xs text-muted-foreground">
                          {new Date(link.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium">
                          {link._count.clicks} clicks
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          onClick={() => copyToClipboard(shortUrl)}
                        >
                          {copiedLink === shortUrl ? (
                            <Check className="w-3 h-3 text-green-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
              {product.links.length > 10 && (
                <p className="text-xs text-muted-foreground text-center mt-2">
                  + {product.links.length - 10} more links
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
