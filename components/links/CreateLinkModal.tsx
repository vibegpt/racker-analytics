/**
 * CREATE/EDIT LINK MODAL
 * 
 * Full-featured modal for creating and editing smart links.
 * Supports standard links, geo-routed links, and Amazon quick setup.
 */
"use client";

import { useState, useEffect } from "react";
import {
  X,
  Link2,
  Globe,
  Loader2,
  Check,
  Copy,
  AlertCircle,
  ChevronDown,
  Youtube,
  Instagram,
  ShoppingCart,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GeoRoutingForm, GeoRoute } from "./GeoRoutingForm";
import { AmazonQuickSetup } from "./AmazonQuickSetup";
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

const PLATFORMS = [
  { id: "TWITTER", name: "Twitter/X", icon: TwitterIcon, color: "bg-black" },
  { id: "YOUTUBE", name: "YouTube", icon: Youtube, color: "bg-red-500" },
  { id: "INSTAGRAM", name: "Instagram", icon: Instagram, color: "bg-pink-500" },
  { id: "NEWSLETTER", name: "Newsletter", icon: Globe, color: "bg-blue-500" },
  { id: "OTHER", name: "Other", icon: Globe, color: "bg-gray-500" },
];

interface LinkData {
  id?: string;
  slug?: string;
  originalUrl: string;
  platform: string;
  routerType: "STANDARD" | "GEO_AFFILIATE";
  geoRoutes: GeoRoute[];
  customSlug?: string;
  campaignName?: string;
}

interface CreateLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (link: any) => void;
  editLink?: LinkData | null;
}

type ModalMode = "choose" | "standard" | "amazon";

export function CreateLinkModal({
  isOpen,
  onClose,
  onSuccess,
  editLink,
}: CreateLinkModalProps) {
  const isEditMode = !!editLink?.id;

  // Mode selection (only for new links)
  const [mode, setMode] = useState<ModalMode>("choose");

  // Form state
  const [originalUrl, setOriginalUrl] = useState("");
  const [platform, setPlatform] = useState("TWITTER");
  const [customSlug, setCustomSlug] = useState("");
  const [campaignName, setCampaignName] = useState("");
  const [enableGeoRouting, setEnableGeoRouting] = useState(false);
  const [geoRoutes, setGeoRoutes] = useState<GeoRoute[]>([]);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdLink, setCreatedLink] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Reset form when modal opens/closes or edit link changes
  useEffect(() => {
    if (isOpen) {
      if (editLink) {
        setMode("standard");
        setOriginalUrl(editLink.originalUrl || "");
        setPlatform(editLink.platform || "TWITTER");
        setCustomSlug(editLink.slug || "");
        setCampaignName(editLink.campaignName || "");
        setEnableGeoRouting(editLink.routerType === "GEO_AFFILIATE");
        setGeoRoutes(editLink.geoRoutes || []);
      } else {
        setMode("choose");
        setOriginalUrl("");
        setPlatform("TWITTER");
        setCustomSlug("");
        setCampaignName("");
        setEnableGeoRouting(false);
        setGeoRoutes([]);
      }
      setError(null);
      setCreatedLink(null);
    }
  }, [isOpen, editLink]);

  const handleSubmit = async () => {
    if (!originalUrl) {
      setError("Please enter a destination URL");
      return;
    }

    try {
      new URL(originalUrl);
    } catch {
      setError("Please enter a valid URL (including https://)");
      return;
    }

    if (enableGeoRouting && geoRoutes.length === 0) {
      setError("Add at least one country route or disable geo routing");
      return;
    }

    if (enableGeoRouting) {
      for (const route of geoRoutes) {
        if (!route.url) {
          setError(`Please enter a URL for ${route.country}`);
          return;
        }
        try {
          new URL(route.url);
        } catch {
          setError(`Invalid URL for ${route.country}`);
          return;
        }
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      const payload: any = {
        originalUrl,
        platform,
        routerType: enableGeoRouting ? "GEO_AFFILIATE" : "STANDARD",
      };

      if (enableGeoRouting) {
        payload.geoRoutes = geoRoutes;
      }

      if (!isEditMode && customSlug) {
        payload.customSlug = customSlug;
      }

      if (campaignName) {
        payload.campaignName = campaignName;
      }

      const url = isEditMode ? `/api/links/${editLink?.id}` : "/api/links";
      const method = isEditMode ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Failed to ${isEditMode ? "update" : "create"} link`);
      }

      if (isEditMode) {
        onSuccess(data.link);
        onClose();
      } else {
        setCreatedLink(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAmazonComplete = (data: { originalUrl: string; geoRoutes: GeoRoute[] }) => {
    setOriginalUrl(data.originalUrl);
    setGeoRoutes(data.geoRoutes);
    setEnableGeoRouting(true);
    setPlatform("OTHER"); // Amazon links can be shared anywhere
    setMode("standard");
  };

  const handleCopy = async () => {
    if (!createdLink?.shortUrl) return;

    try {
      await navigator.clipboard.writeText(`https://${createdLink.shortUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
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
    setMode("choose");
    setOriginalUrl("");
    setCustomSlug("");
    setCampaignName("");
    setEnableGeoRouting(false);
    setGeoRoutes([]);
    setCreatedLink(null);
    setError(null);
  };

  const handleDone = () => {
    if (createdLink) {
      onSuccess(createdLink.link);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-background border rounded-xl shadow-2xl mx-4">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b bg-background">
          <div className="flex items-center gap-2">
            {mode !== "choose" && !isEditMode && !createdLink && (
              <button
                onClick={() => setMode("choose")}
                className="p-1 rounded-lg hover:bg-muted transition-colors mr-1"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <Link2 className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">
              {isEditMode
                ? "Edit Link"
                : createdLink
                ? "Link Created!"
                : mode === "amazon"
                ? "Amazon Affiliate Link"
                : mode === "standard"
                ? "Create Smart Link"
                : "Create Link"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Mode Selection */}
          {mode === "choose" && !createdLink && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                What type of link do you want to create?
              </p>

              {/* Amazon Quick Setup */}
              <button
                onClick={() => setMode("amazon")}
                className="w-full p-4 rounded-xl border-2 border-dashed hover:border-amber-500/50 hover:bg-amber-500/5 transition-all text-left group"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-amber-500/10 group-hover:bg-amber-500/20 transition-colors">
                    <ShoppingCart className="w-6 h-6 text-amber-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">Amazon Affiliate Link</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Paste any Amazon URL. We will auto-generate geo-routed links for all your affiliate tags.
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600">
                        Recommended for affiliates
                      </span>
                    </div>
                  </div>
                </div>
              </button>

              {/* Standard Link */}
              <button
                onClick={() => setMode("standard")}
                className="w-full p-4 rounded-xl border hover:border-primary/50 hover:bg-primary/5 transition-all text-left group"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <Link2 className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">Standard Smart Link</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Track clicks to any URL. Optionally add geo-routing for international audiences.
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        Stripe, Gumroad, any URL
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* Amazon Quick Setup */}
          {mode === "amazon" && !createdLink && (
            <AmazonQuickSetup
              onComplete={handleAmazonComplete}
              onCancel={() => setMode("choose")}
            />
          )}

          {/* Standard Form */}
          {mode === "standard" && !createdLink && (
            <div className="space-y-6">
              {/* Error */}
              {error && (
                <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/5 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5" />
                  <p className="text-sm text-red-500">{error}</p>
                </div>
              )}

              {/* Destination URL */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Destination URL</label>
                <input
                  type="text"
                  placeholder="https://buy.stripe.com/..."
                  value={originalUrl}
                  onChange={(e) => setOriginalUrl(e.target.value)}
                  disabled={isLoading}
                  className="h-11 w-full px-3 rounded-md border border-input bg-background text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Your checkout URL, product page, or any link you want to track
                </p>
              </div>

              {/* Platform */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Platform</label>
                <div className="grid grid-cols-5 gap-2">
                  {PLATFORMS.map((p) => {
                    const Icon = p.icon;
                    const isSelected = platform === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPlatform(p.id)}
                        disabled={isLoading}
                        className={cn(
                          "flex flex-col items-center gap-1 p-2 rounded-lg border transition-all",
                          isSelected
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <div
                          className={cn(
                            "flex items-center justify-center w-8 h-8 rounded-md text-white",
                            p.color
                          )}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-medium truncate w-full text-center">
                          {p.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Geo Routing Toggle */}
              <div className="p-4 rounded-lg border bg-card">
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Globe className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Geo Affiliate Routing</p>
                      <p className="text-xs text-muted-foreground">
                        Route visitors to country-specific URLs
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={enableGeoRouting}
                    onChange={(e) => setEnableGeoRouting(e.target.checked)}
                    disabled={isLoading}
                    className="w-5 h-5 rounded border-input"
                  />
                </label>

                {enableGeoRouting && (
                  <div className="mt-4 pt-4 border-t">
                    <GeoRoutingForm
                      routes={geoRoutes}
                      onChange={setGeoRoutes}
                      defaultUrl={originalUrl}
                      disabled={isLoading}
                    />
                  </div>
                )}
              </div>

              {/* Advanced Options */}
              {!isEditMode && (
                <div>
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                  >
                    <ChevronDown
                      className={cn(
                        "w-4 h-4 transition-transform",
                        showAdvanced && "rotate-180"
                      )}
                    />
                    Advanced Options
                  </button>

                  {showAdvanced && (
                    <div className="mt-3 space-y-4 pl-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Custom Slug</label>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">{SHORT_DOMAIN}/</span>
                          <input
                            type="text"
                            placeholder="my-product"
                            value={customSlug}
                            onChange={(e) =>
                              setCustomSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ""))
                            }
                            disabled={isLoading}
                            className="h-9 flex-1 px-3 rounded-md border border-input bg-background text-sm font-mono"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Campaign Name</label>
                        <input
                          type="text"
                          placeholder="Summer Sale 2024"
                          value={campaignName}
                          onChange={(e) => setCampaignName(e.target.value)}
                          disabled={isLoading}
                          className="h-9 w-full px-3 rounded-md border border-input bg-background text-sm"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={onClose} disabled={isLoading}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {isEditMode ? "Saving..." : "Creating..."}
                    </>
                  ) : isEditMode ? (
                    "Save Changes"
                  ) : (
                    "Create Link"
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Success State */}
          {createdLink && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-green-500/30 bg-green-500/5 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-500/10 mb-3">
                  <Check className="w-6 h-6 text-green-500" />
                </div>
                <p className="font-medium text-green-500">Link Created Successfully!</p>
              </div>

              <div className="p-4 rounded-lg border bg-card">
                <label className="text-xs text-muted-foreground">Your Smart Link</label>
                <div className="flex items-center gap-2 mt-2">
                  <code className="flex-1 p-2 rounded bg-muted text-sm font-mono truncate">
                    https://{createdLink.shortUrl}
                  </code>
                  <Button size="sm" variant="outline" onClick={handleCopy}>
                    {copied ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {createdLink.isGeoRouted && (
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="w-4 h-4 text-primary" />
                    <span>
                      Geo routing enabled for {createdLink.routeCount} countries
                    </span>
                  </div>
                </div>
              )}

              <div className="p-4 rounded-lg bg-muted/30">
                <p className="text-sm font-medium mb-2">What happens next?</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Share this link in your content</li>
                  <li>• Every click is tracked automatically</li>
                  {createdLink.isGeoRouted && (
                    <li>• Visitors are routed to the right store for their country</li>
                  )}
                  <li>• Revenue is attributed to your posts</li>
                </ul>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={handleCreateAnother}>
                  Create Another
                </Button>
                <Button onClick={handleDone}>Done</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
