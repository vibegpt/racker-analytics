"use client";

import { useState, useEffect } from "react";
import {
  Target,
  MousePointer,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  FileText,
  Code,
  Copy,
  Check,
  Loader2,
  ExternalLink,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FormConversion {
  id: string;
  linkId: string | null;
  trackerId: string | null;
  formName: string | null;
  pageUrl: string;
  email: string | null;
  name: string | null;
  confidenceScore: number;
  timeSinceClick: number | null;
  submittedAt: string;
  link?: {
    slug: string;
    platform: string;
  };
}

interface PageView {
  id: string;
  trackerId: string;
  pageUrl: string;
  pageTitle: string | null;
  country: string | null;
  deviceType: string | null;
  viewedAt: string;
}

// Mock data for development
const MOCK_CONVERSIONS: FormConversion[] = [
  {
    id: "1",
    linkId: "link-1",
    trackerId: "rckr_abc123",
    formName: "Contact Form",
    pageUrl: "https://mysite.com/contact",
    email: "john@example.com",
    name: "John Doe",
    confidenceScore: 0.85,
    timeSinceClick: 12,
    submittedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    link: { slug: "summer-promo", platform: "INSTAGRAM" },
  },
  {
    id: "2",
    linkId: "link-2",
    trackerId: "rckr_def456",
    formName: "Newsletter Signup",
    pageUrl: "https://mysite.com/",
    email: "jane@example.com",
    name: null,
    confidenceScore: 0.92,
    timeSinceClick: 5,
    submittedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    link: { slug: "fb-ad-1", platform: "OTHER" },
  },
];

const MOCK_PAGE_VIEWS: PageView[] = [
  {
    id: "1",
    trackerId: "rckr_abc123",
    pageUrl: "https://mysite.com/",
    pageTitle: "Home - My Site",
    country: "US",
    deviceType: "mobile",
    viewedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "2",
    trackerId: "rckr_def456",
    pageUrl: "https://mysite.com/services",
    pageTitle: "Services",
    country: "UK",
    deviceType: "desktop",
    viewedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
];

export default function ConversionsPage() {
  const [activeTab, setActiveTab] = useState<"conversions" | "pageviews" | "setup">("conversions");
  const [conversions, setConversions] = useState<FormConversion[]>(MOCK_CONVERSIONS);
  const [pageViews, setPageViews] = useState<PageView[]>(MOCK_PAGE_VIEWS);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const trackingScript = `<script src="https://rackr.co/track.js"></script>`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(trackingScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return "text-green-400";
    if (score >= 0.5) return "text-yellow-400";
    return "text-red-400";
  };

  const getConfidenceLabel = (score: number) => {
    if (score >= 0.8) return "High";
    if (score >= 0.5) return "Medium";
    return "Low";
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    return `${diffMins}m ago`;
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Target className="w-6 h-6 text-[#13eca4]" />
              Conversions
            </h1>
            <p className="text-white/60 mt-1">
              Track form submissions and page views from your links
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-white/10 bg-white/5">
            <div className="flex items-center gap-2 text-white/60 mb-1">
              <Eye className="w-4 h-4" />
              <span className="text-sm">Page Views</span>
            </div>
            <p className="text-2xl font-bold">{pageViews.length}</p>
          </div>
          <div className="p-4 rounded-xl border border-white/10 bg-white/5">
            <div className="flex items-center gap-2 text-white/60 mb-1">
              <FileText className="w-4 h-4" />
              <span className="text-sm">Form Submissions</span>
            </div>
            <p className="text-2xl font-bold">{conversions.length}</p>
          </div>
          <div className="p-4 rounded-xl border border-white/10 bg-white/5">
            <div className="flex items-center gap-2 text-white/60 mb-1">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-sm">Attributed</span>
            </div>
            <p className="text-2xl font-bold">
              {conversions.filter((c) => c.confidenceScore >= 0.5).length}
            </p>
          </div>
          <div className="p-4 rounded-xl border border-white/10 bg-white/5">
            <div className="flex items-center gap-2 text-white/60 mb-1">
              <Target className="w-4 h-4" />
              <span className="text-sm">Conversion Rate</span>
            </div>
            <p className="text-2xl font-bold">
              {pageViews.length > 0
                ? ((conversions.length / pageViews.length) * 100).toFixed(1)
                : "0"}
              %
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-white/5 w-fit">
          <button
            onClick={() => setActiveTab("conversions")}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-md transition-colors",
              activeTab === "conversions"
                ? "bg-white/10 text-white"
                : "text-white/60 hover:text-white"
            )}
          >
            Form Submissions
          </button>
          <button
            onClick={() => setActiveTab("pageviews")}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-md transition-colors",
              activeTab === "pageviews"
                ? "bg-white/10 text-white"
                : "text-white/60 hover:text-white"
            )}
          >
            Page Views
          </button>
          <button
            onClick={() => setActiveTab("setup")}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-md transition-colors",
              activeTab === "setup"
                ? "bg-white/10 text-white"
                : "text-white/60 hover:text-white"
            )}
          >
            Setup Guide
          </button>
        </div>

        {/* Conversions Tab */}
        {activeTab === "conversions" && (
          <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
            {conversions.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 mx-auto text-white/20 mb-4" />
                <h3 className="font-semibold mb-2">No form submissions yet</h3>
                <p className="text-white/60 text-sm mb-4">
                  Install the tracking script on your site to start tracking
                </p>
                <Button
                  onClick={() => setActiveTab("setup")}
                  className="bg-[#13eca4] text-[#0a0a0a] hover:bg-[#0fd492]"
                >
                  View Setup Guide
                </Button>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr className="text-left text-white/60 text-sm">
                    <th className="px-4 py-3">Form</th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3">Source Link</th>
                    <th className="px-4 py-3">Confidence</th>
                    <th className="px-4 py-3">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {conversions.map((conversion) => (
                    <tr
                      key={conversion.id}
                      className="border-t border-white/10 hover:bg-white/5"
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium">
                          {conversion.formName || "Unknown Form"}
                        </p>
                        <p className="text-xs text-white/40 truncate max-w-[200px]">
                          {conversion.pageUrl}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm">{conversion.name || "—"}</p>
                        <p className="text-xs text-white/60">
                          {conversion.email || "No email"}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        {conversion.link ? (
                          <div>
                            <code className="text-xs bg-white/10 px-2 py-0.5 rounded">
                              {conversion.link.slug}
                            </code>
                            <p className="text-xs text-white/40 mt-1">
                              {conversion.link.platform}
                            </p>
                          </div>
                        ) : (
                          <span className="text-white/40 text-sm">
                            Not attributed
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "text-sm font-medium",
                            getConfidenceColor(conversion.confidenceScore)
                          )}
                        >
                          {getConfidenceLabel(conversion.confidenceScore)}
                        </span>
                        <p className="text-xs text-white/40">
                          {(conversion.confidenceScore * 100).toFixed(0)}%
                        </p>
                      </td>
                      <td className="px-4 py-3 text-sm text-white/60">
                        {formatTimeAgo(conversion.submittedAt)}
                        {conversion.timeSinceClick && (
                          <p className="text-xs text-white/40">
                            {conversion.timeSinceClick}m after click
                          </p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Page Views Tab */}
        {activeTab === "pageviews" && (
          <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
            {pageViews.length === 0 ? (
              <div className="text-center py-12">
                <Eye className="w-12 h-12 mx-auto text-white/20 mb-4" />
                <h3 className="font-semibold mb-2">No page views tracked yet</h3>
                <p className="text-white/60 text-sm">
                  Page views will appear once visitors click your Rackr links
                </p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr className="text-left text-white/60 text-sm">
                    <th className="px-4 py-3">Page</th>
                    <th className="px-4 py-3">Tracker</th>
                    <th className="px-4 py-3">Location</th>
                    <th className="px-4 py-3">Device</th>
                    <th className="px-4 py-3">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {pageViews.map((pv) => (
                    <tr
                      key={pv.id}
                      className="border-t border-white/10 hover:bg-white/5"
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium truncate max-w-[250px]">
                          {pv.pageTitle || pv.pageUrl}
                        </p>
                        <p className="text-xs text-white/40 truncate max-w-[250px]">
                          {pv.pageUrl}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <code className="text-xs bg-white/10 px-2 py-0.5 rounded">
                          {pv.trackerId.slice(0, 15)}...
                        </code>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {pv.country || "Unknown"}
                      </td>
                      <td className="px-4 py-3 text-sm capitalize">
                        {pv.deviceType || "Unknown"}
                      </td>
                      <td className="px-4 py-3 text-sm text-white/60">
                        {formatTimeAgo(pv.viewedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Setup Tab */}
        {activeTab === "setup" && (
          <div className="space-y-6">
            {/* Squarespace Instructions */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <Code className="w-5 h-5 text-[#13eca4]" />
                Squarespace Setup
              </h2>

              <ol className="space-y-4">
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#13eca4]/20 flex items-center justify-center text-[#13eca4] text-sm font-bold shrink-0">
                    1
                  </span>
                  <div>
                    <p className="font-medium">Copy the tracking script</p>
                    <div className="mt-2 relative">
                      <pre className="bg-black/50 rounded-lg p-4 text-sm overflow-x-auto">
                        <code className="text-[#13eca4]">{trackingScript}</code>
                      </pre>
                      <button
                        onClick={handleCopy}
                        className="absolute top-2 right-2 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                      >
                        {copied ? (
                          <Check className="w-4 h-4 text-green-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </li>

                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#13eca4]/20 flex items-center justify-center text-[#13eca4] text-sm font-bold shrink-0">
                    2
                  </span>
                  <div>
                    <p className="font-medium">
                      Go to Squarespace Settings &gt; Advanced &gt; Code Injection
                    </p>
                    <p className="text-sm text-white/60 mt-1">
                      Or navigate via: Settings &rarr; Website &rarr; Website Tools
                      &rarr; Code Injection
                    </p>
                  </div>
                </li>

                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#13eca4]/20 flex items-center justify-center text-[#13eca4] text-sm font-bold shrink-0">
                    3
                  </span>
                  <div>
                    <p className="font-medium">
                      Paste the script in the &quot;Header&quot; section
                    </p>
                    <p className="text-sm text-white/60 mt-1">
                      This ensures the script loads on every page of your site
                    </p>
                  </div>
                </li>

                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#13eca4]/20 flex items-center justify-center text-[#13eca4] text-sm font-bold shrink-0">
                    4
                  </span>
                  <div>
                    <p className="font-medium">Save and you&apos;re done!</p>
                    <p className="text-sm text-white/60 mt-1">
                      The script will automatically track page views and form
                      submissions from visitors who clicked your Rackr links
                    </p>
                  </div>
                </li>
              </ol>
            </div>

            {/* How It Works */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <h2 className="font-semibold mb-4">How It Works</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4">
                  <div className="w-12 h-12 rounded-full bg-[#13eca4]/20 flex items-center justify-center mx-auto mb-3">
                    <MousePointer className="w-6 h-6 text-[#13eca4]" />
                  </div>
                  <p className="font-medium text-sm">1. User clicks link</p>
                  <p className="text-xs text-white/60 mt-1">
                    From Instagram or Facebook
                  </p>
                </div>
                <div className="text-center p-4">
                  <div className="w-12 h-12 rounded-full bg-[#13eca4]/20 flex items-center justify-center mx-auto mb-3">
                    <Target className="w-6 h-6 text-[#13eca4]" />
                  </div>
                  <p className="font-medium text-sm">2. Rackr tracks click</p>
                  <p className="text-xs text-white/60 mt-1">
                    Adds tracker to URL
                  </p>
                </div>
                <div className="text-center p-4">
                  <div className="w-12 h-12 rounded-full bg-[#13eca4]/20 flex items-center justify-center mx-auto mb-3">
                    <Eye className="w-6 h-6 text-[#13eca4]" />
                  </div>
                  <p className="font-medium text-sm">3. Script tracks visit</p>
                  <p className="text-xs text-white/60 mt-1">
                    Page view recorded
                  </p>
                </div>
                <div className="text-center p-4">
                  <div className="w-12 h-12 rounded-full bg-[#13eca4]/20 flex items-center justify-center mx-auto mb-3">
                    <FileText className="w-6 h-6 text-[#13eca4]" />
                  </div>
                  <p className="font-medium text-sm">4. Form submitted</p>
                  <p className="text-xs text-white/60 mt-1">
                    Attributed to source
                  </p>
                </div>
              </div>
            </div>

            {/* Testing */}
            <div className="rounded-xl border border-[#13eca4]/30 bg-[#13eca4]/5 p-6">
              <h2 className="font-semibold mb-2 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-[#13eca4]" />
                Testing Your Setup
              </h2>
              <p className="text-sm text-white/80 mb-4">
                After installing the script, test it by:
              </p>
              <ol className="space-y-2 text-sm text-white/80">
                <li>1. Create a Rackr link pointing to your Squarespace site</li>
                <li>2. Click the link (this simulates a visitor from social media)</li>
                <li>3. Browse your site - page views should appear here</li>
                <li>4. Fill out a form - the submission should appear as a conversion</li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
