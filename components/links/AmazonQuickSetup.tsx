/**
 * AMAZON QUICK SETUP
 * 
 * Streamlined flow for creating Amazon affiliate links with geo routing.
 * - Paste any Amazon URL or enter ASIN
 * - Auto-detects ASIN and country
 * - Enter affiliate tags for each country
 * - Generates all URLs automatically
 */
"use client";

import { useState, useEffect } from "react";
import { 
  ShoppingCart, 
  Wand2, 
  Check, 
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Amazon domains and their country codes
const AMAZON_STORES = [
  { code: "US", domain: "amazon.com", name: "United States", flag: "🇺🇸", popular: true },
  { code: "GB", domain: "amazon.co.uk", name: "United Kingdom", flag: "🇬🇧", popular: true },
  { code: "DE", domain: "amazon.de", name: "Germany", flag: "🇩🇪", popular: true },
  { code: "CA", domain: "amazon.ca", name: "Canada", flag: "🇨🇦", popular: true },
  { code: "FR", domain: "amazon.fr", name: "France", flag: "🇫🇷", popular: false },
  { code: "IT", domain: "amazon.it", name: "Italy", flag: "🇮🇹", popular: false },
  { code: "ES", domain: "amazon.es", name: "Spain", flag: "🇪🇸", popular: false },
  { code: "AU", domain: "amazon.com.au", name: "Australia", flag: "🇦🇺", popular: true },
  { code: "JP", domain: "amazon.co.jp", name: "Japan", flag: "🇯🇵", popular: false },
  { code: "IN", domain: "amazon.in", name: "India", flag: "🇮🇳", popular: false },
  { code: "MX", domain: "amazon.com.mx", name: "Mexico", flag: "🇲🇽", popular: false },
  { code: "BR", domain: "amazon.com.br", name: "Brazil", flag: "🇧🇷", popular: false },
  { code: "NL", domain: "amazon.nl", name: "Netherlands", flag: "🇳🇱", popular: false },
  { code: "SE", domain: "amazon.se", name: "Sweden", flag: "🇸🇪", popular: false },
];

interface AmazonQuickSetupProps {
  onComplete: (data: {
    originalUrl: string;
    geoRoutes: { country: string; url: string }[];
  }) => void;
  onCancel: () => void;
}

export function AmazonQuickSetup({ onComplete, onCancel }: AmazonQuickSetupProps) {
  const [step, setStep] = useState(1);
  const [inputUrl, setInputUrl] = useState("");
  const [asin, setAsin] = useState("");
  const [detectedCountry, setDetectedCountry] = useState<string | null>(null);
  const [tags, setTags] = useState<Record<string, string>>({});
  const [showAllCountries, setShowAllCountries] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Extract ASIN from Amazon URL
  const extractAsin = (url: string): string | null => {
    // Match patterns like /dp/B08X123ABC or /gp/product/B08X123ABC
    const patterns = [
      /\/dp\/([A-Z0-9]{10})/i,
      /\/gp\/product\/([A-Z0-9]{10})/i,
      /\/product\/([A-Z0-9]{10})/i,
      /\/ASIN\/([A-Z0-9]{10})/i,
      /amazon\.[a-z.]+.*?([A-Z0-9]{10})/i,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1].toUpperCase();
      }
    }

    // Check if input is just an ASIN
    if (/^[A-Z0-9]{10}$/i.test(url.trim())) {
      return url.trim().toUpperCase();
    }

    return null;
  };

  // Detect country from Amazon URL
  const detectCountry = (url: string): string | null => {
    for (const store of AMAZON_STORES) {
      if (url.includes(store.domain)) {
        return store.code;
      }
    }
    return null;
  };

  // Extract existing affiliate tag from URL
  const extractTag = (url: string): string | null => {
    const match = url.match(/[?&]tag=([^&]+)/);
    return match ? match[1] : null;
  };

  // Handle URL input change
  useEffect(() => {
    if (!inputUrl) {
      setAsin("");
      setDetectedCountry(null);
      return;
    }

    const extractedAsin = extractAsin(inputUrl);
    const country = detectCountry(inputUrl);
    const existingTag = extractTag(inputUrl);

    if (extractedAsin) {
      setAsin(extractedAsin);
      setError(null);
    }

    if (country) {
      setDetectedCountry(country);
      if (existingTag && !tags[country]) {
        setTags({ ...tags, [country]: existingTag });
      }
    }
  }, [inputUrl]);

  // Generate final URLs
  const generateUrls = () => {
    const routes: { country: string; url: string }[] = [];
    let defaultUrl = "";

    // Find the default (usually US or the detected country)
    const defaultCountry = detectedCountry || "US";
    const defaultStore = AMAZON_STORES.find(s => s.code === defaultCountry);
    const defaultTag = tags[defaultCountry] || tags.US || Object.values(tags)[0];

    if (defaultStore && defaultTag) {
      defaultUrl = `https://${defaultStore.domain}/dp/${asin}?tag=${defaultTag}`;
    } else if (defaultStore) {
      defaultUrl = `https://${defaultStore.domain}/dp/${asin}`;
    }

    // Generate routes for countries with tags
    Object.entries(tags).forEach(([code, tag]) => {
      if (!tag.trim()) return;
      const store = AMAZON_STORES.find(s => s.code === code);
      if (store) {
        routes.push({
          country: code,
          url: `https://${store.domain}/dp/${asin}?tag=${tag}`,
        });
      }
    });

    return { defaultUrl, routes };
  };

  const handleContinue = () => {
    if (step === 1) {
      if (!asin) {
        setError("Please enter a valid Amazon URL or ASIN");
        return;
      }
      setError(null);
      setStep(2);
    } else if (step === 2) {
      const filledTags = Object.values(tags).filter(t => t.trim());
      if (filledTags.length === 0) {
        setError("Please enter at least one affiliate tag");
        return;
      }
      setError(null);
      setStep(3);
    }
  };

  const handleComplete = () => {
    const { defaultUrl, routes } = generateUrls();
    onComplete({
      originalUrl: defaultUrl,
      geoRoutes: routes,
    });
  };

  const { defaultUrl, routes } = generateUrls();
  const popularStores = AMAZON_STORES.filter(s => s.popular);
  const otherStores = AMAZON_STORES.filter(s => !s.popular);
  const displayStores = showAllCountries ? AMAZON_STORES : popularStores;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b">
        <div className="p-2 rounded-lg bg-amber-500/10">
          <ShoppingCart className="w-5 h-5 text-amber-500" />
        </div>
        <div>
          <h3 className="font-semibold">Amazon Affiliate Quick Setup</h3>
          <p className="text-sm text-muted-foreground">
            Create geo-routed affiliate links in seconds
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center">
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                step >= s
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {step > s ? <Check className="w-4 h-4" /> : s}
            </div>
            {s < 3 && (
              <ChevronRight className="w-4 h-4 mx-2 text-muted-foreground" />
            )}
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/5 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500" />
          <p className="text-sm text-red-500">{error}</p>
        </div>
      )}

      {/* Step 1: Enter URL/ASIN */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Amazon Product URL or ASIN</label>
            <input
              type="text"
              placeholder="Paste Amazon URL or enter ASIN (e.g., B08X123ABC)"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              className="mt-2 h-11 w-full px-3 rounded-md border border-input bg-background text-sm"
              autoFocus
            />
            <p className="text-xs text-muted-foreground mt-2">
              We will automatically extract the product ID
            </p>
          </div>

          {/* Detection Results */}
          {asin && (
            <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/20 space-y-2">
              <div className="flex items-center gap-2 text-green-600">
                <Check className="w-4 h-4" />
                <span className="text-sm font-medium">Product detected!</span>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">ASIN: </span>
                  <code className="font-mono bg-muted px-1 rounded">{asin}</code>
                </div>
                {detectedCountry && (
                  <div>
                    <span className="text-muted-foreground">Store: </span>
                    <span>
                      {AMAZON_STORES.find(s => s.code === detectedCountry)?.flag}{" "}
                      {AMAZON_STORES.find(s => s.code === detectedCountry)?.name}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Enter Affiliate Tags */}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Your Affiliate Tags</label>
            <p className="text-xs text-muted-foreground mt-1">
              Enter your affiliate tag for each Amazon store. Leave blank to skip.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {displayStores.map((store) => (
              <div key={store.code} className="flex items-center gap-2">
                <span className="text-lg w-6">{store.flag}</span>
                <input
                  type="text"
                  placeholder={`${store.code} tag`}
                  value={tags[store.code] || ""}
                  onChange={(e) =>
                    setTags({ ...tags, [store.code]: e.target.value.trim() })
                  }
                  className={cn(
                    "h-9 flex-1 px-3 rounded-md border bg-background text-sm font-mono",
                    tags[store.code] ? "border-green-500/50" : "border-input"
                  )}
                />
              </div>
            ))}
          </div>

          {!showAllCountries && (
            <button
              type="button"
              onClick={() => setShowAllCountries(true)}
              className="text-sm text-primary hover:underline"
            >
              + Show {otherStores.length} more countries
            </button>
          )}

          <div className="p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
            <strong>Tip:</strong> At minimum, add tags for US and UK to capture most international traffic.
          </div>
        </div>
      )}

      {/* Step 3: Preview & Confirm */}
      {step === 3 && (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Preview Generated Links</label>
            <p className="text-xs text-muted-foreground mt-1">
              These URLs will be used for geo-routing
            </p>
          </div>

          {/* Default URL */}
          <div className="p-3 rounded-lg border bg-card">
            <div className="flex items-center gap-2 text-sm mb-2">
              <Globe className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">Default (all other countries)</span>
            </div>
            <code className="text-xs font-mono text-muted-foreground break-all">
              {defaultUrl}
            </code>
          </div>

          {/* Country Routes */}
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {routes.map((route) => {
              const store = AMAZON_STORES.find(s => s.code === route.country);
              return (
                <div
                  key={route.country}
                  className="flex items-center gap-3 p-2 rounded-lg bg-muted/30"
                >
                  <span className="text-lg">{store?.flag}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{store?.name}</p>
                    <code className="text-xs font-mono text-muted-foreground truncate block">
                      {route.url}
                    </code>
                  </div>
                  <a
                    href={route.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 hover:bg-muted rounded"
                  >
                    <ExternalLink className="w-3 h-3 text-muted-foreground" />
                  </a>
                </div>
              );
            })}
          </div>

          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-sm">
            <strong>{routes.length}</strong> country-specific routes will be created.
            Visitors from other countries will see the default Amazon link.
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t">
        <Button
          variant="ghost"
          onClick={step === 1 ? onCancel : () => setStep(step - 1)}
        >
          {step === 1 ? "Cancel" : "Back"}
        </Button>

        {step < 3 ? (
          <Button onClick={handleContinue}>
            Continue
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={handleComplete} className="gap-2">
            <Wand2 className="w-4 h-4" />
            Create Link
          </Button>
        )}
      </div>
    </div>
  );
}
