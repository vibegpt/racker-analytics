/**
 * GEO ROUTING FORM
 * 
 * Allows creators to add country-specific URLs for affiliate routing.
 * Includes Amazon ASIN helper for quick setup.
 */
"use client";

import { useState } from "react";
import { Plus, Trash2, Globe, HelpCircle, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Common Amazon countries
const AMAZON_COUNTRIES = [
  { code: "US", name: "United States", domain: "amazon.com", flag: "🇺🇸" },
  { code: "GB", name: "United Kingdom", domain: "amazon.co.uk", flag: "🇬🇧" },
  { code: "DE", name: "Germany", domain: "amazon.de", flag: "🇩🇪" },
  { code: "FR", name: "France", domain: "amazon.fr", flag: "🇫🇷" },
  { code: "CA", name: "Canada", domain: "amazon.ca", flag: "🇨🇦" },
  { code: "AU", name: "Australia", domain: "amazon.com.au", flag: "🇦🇺" },
  { code: "IT", name: "Italy", domain: "amazon.it", flag: "🇮🇹" },
  { code: "ES", name: "Spain", domain: "amazon.es", flag: "🇪🇸" },
  { code: "JP", name: "Japan", domain: "amazon.co.jp", flag: "🇯🇵" },
  { code: "IN", name: "India", domain: "amazon.in", flag: "🇮🇳" },
  { code: "MX", name: "Mexico", domain: "amazon.com.mx", flag: "🇲🇽" },
  { code: "BR", name: "Brazil", domain: "amazon.com.br", flag: "🇧🇷" },
  { code: "NL", name: "Netherlands", domain: "amazon.nl", flag: "🇳🇱" },
  { code: "SE", name: "Sweden", domain: "amazon.se", flag: "🇸🇪" },
];

export interface GeoRoute {
  country: string;
  url: string;
  label?: string;
}

interface GeoRoutingFormProps {
  routes: GeoRoute[];
  onChange: (routes: GeoRoute[]) => void;
  defaultUrl: string;
  disabled?: boolean;
}

export function GeoRoutingForm({
  routes,
  onChange,
  defaultUrl,
  disabled = false,
}: GeoRoutingFormProps) {
  const [showAmazonHelper, setShowAmazonHelper] = useState(false);
  const [amazonAsin, setAmazonAsin] = useState("");
  const [amazonTags, setAmazonTags] = useState<Record<string, string>>({});

  const addRoute = () => {
    // Find first country not already used
    const usedCountries = routes.map((r) => r.country);
    const available = AMAZON_COUNTRIES.find((c) => !usedCountries.includes(c.code));
    
    if (available) {
      onChange([...routes, { country: available.code, url: "" }]);
    }
  };

  const removeRoute = (index: number) => {
    onChange(routes.filter((_, i) => i !== index));
  };

  const updateRoute = (index: number, field: keyof GeoRoute, value: string) => {
    const updated = [...routes];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  // Amazon helper: generate URLs from ASIN and tags
  const generateAmazonRoutes = () => {
    if (!amazonAsin) return;

    const newRoutes: GeoRoute[] = Object.entries(amazonTags)
      .filter(([_, tag]) => tag.trim())
      .map(([code, tag]) => {
        const country = AMAZON_COUNTRIES.find((c) => c.code === code);
        return {
          country: code,
          url: `https://${country?.domain || "amazon.com"}/dp/${amazonAsin}?tag=${tag}`,
          label: `Amazon ${code}`,
        };
      });

    onChange(newRoutes);
    setShowAmazonHelper(false);
  };

  const usedCountries = routes.map((r) => r.country);
  const availableCountries = AMAZON_COUNTRIES.filter(
    (c) => !usedCountries.includes(c.code)
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">Country-Specific URLs</span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowAmazonHelper(!showAmazonHelper)}
          disabled={disabled}
          className="text-xs gap-1"
        >
          <Wand2 className="w-3 h-3" />
          Amazon Helper
        </Button>
      </div>

      {/* Amazon Helper Panel */}
      {showAmazonHelper && (
        <div className="p-4 rounded-lg border border-amber-500/30 bg-amber-500/5 space-y-4">
          <div className="flex items-start gap-2">
            <HelpCircle className="w-4 h-4 text-amber-500 mt-0.5" />
            <div className="text-xs text-muted-foreground">
              Enter your product ASIN and affiliate tags. We will generate all the URLs for you.
            </div>
          </div>

          {/* ASIN Input */}
          <div>
            <label className="text-xs font-medium">Amazon ASIN</label>
            <input
              type="text"
              placeholder="B08X123ABC"
              value={amazonAsin}
              onChange={(e) => setAmazonAsin(e.target.value.toUpperCase())}
              className="mt-1 h-9 w-full px-3 rounded-md border border-input bg-background text-sm font-mono"
              disabled={disabled}
            />
          </div>

          {/* Affiliate Tags Grid */}
          <div>
            <label className="text-xs font-medium">Affiliate Tags by Country</label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {AMAZON_COUNTRIES.slice(0, 8).map((country) => (
                <div key={country.code} className="flex items-center gap-2">
                  <span className="text-sm">{country.flag}</span>
                  <input
                    type="text"
                    placeholder={`${country.code} tag`}
                    value={amazonTags[country.code] || ""}
                    onChange={(e) =>
                      setAmazonTags({ ...amazonTags, [country.code]: e.target.value })
                    }
                    className="h-8 flex-1 px-2 rounded-md border border-input bg-background text-xs font-mono"
                    disabled={disabled}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <Button
            type="button"
            size="sm"
            onClick={generateAmazonRoutes}
            disabled={!amazonAsin || Object.values(amazonTags).every((t) => !t.trim())}
            className="w-full"
          >
            Generate Amazon Links
          </Button>
        </div>
      )}

      {/* Default URL Info */}
      <div className="p-3 rounded-lg bg-muted/30 text-xs">
        <span className="text-muted-foreground">Default (all other countries): </span>
        <span className="font-mono truncate">{defaultUrl || "Not set"}</span>
      </div>

      {/* Routes List */}
      <div className="space-y-2">
        {routes.map((route, index) => {
          const countryInfo = AMAZON_COUNTRIES.find((c) => c.code === route.country);
          
          return (
            <div
              key={index}
              className="flex items-center gap-2 p-3 rounded-lg border bg-card"
            >
              {/* Country Selector */}
              <select
                value={route.country}
                onChange={(e) => updateRoute(index, "country", e.target.value)}
                disabled={disabled}
                className="h-9 px-2 rounded-md border border-input bg-background text-sm w-32"
              >
                <option value={route.country}>
                  {countryInfo?.flag} {route.country}
                </option>
                {availableCountries.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.code}
                  </option>
                ))}
              </select>

              {/* URL Input */}
              <input
                type="text"
                placeholder="https://amazon.co.uk/dp/..."
                value={route.url}
                onChange={(e) => updateRoute(index, "url", e.target.value)}
                disabled={disabled}
                className="h-9 flex-1 px-3 rounded-md border border-input bg-background text-sm font-mono"
              />

              {/* Remove Button */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeRoute(index)}
                disabled={disabled}
                className="h-9 w-9 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          );
        })}
      </div>

      {/* Add Country Button */}
      {availableCountries.length > 0 && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addRoute}
          disabled={disabled}
          className="w-full gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Country
        </Button>
      )}

      {/* Summary */}
      {routes.length > 0 && (
        <div className="text-xs text-muted-foreground">
          {routes.length} country-specific route{routes.length !== 1 ? "s" : ""} configured.
          Visitors from other countries will see the default URL.
        </div>
      )}
    </div>
  );
}
