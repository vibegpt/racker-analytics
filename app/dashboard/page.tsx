"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Link2, TrendingUp, DollarSign, BarChart3, Plus, Lock, ArrowRight, Loader2, Calendar } from "lucide-react";
import Link from "next/link";
import { SHORT_DOMAIN } from "@/lib/config";
import { RevenuePieChart } from "@/components/revenue-pie-chart";
import { ContentEmbedCompact } from "@/components/content-embed";
import { getEmbedUrl } from "@/lib/utils/parse-content-url";
import { Platform } from "@prisma/client";
import { cn } from "@/lib/utils";

type TimePeriod = "7d" | "30d" | "all";

interface SmartLink {
  id: string;
  slug: string;
  platform: string;
  createdAt: string;
  sourceUrl?: string;
  sourcePlatform?: Platform;
  sourceContentId?: string;
  sourceTitle?: string;
  _count: {
    clicks: number;
    attributions: number;
  };
}

interface DashboardStats {
  totalClicks: number;
  totalLinks: number;
  totalProducts: number;
  recentLinks: SmartLink[];
}

// TODO: Get from user subscription
const IS_FREE_TIER = false; // Set to false to test paid features

// Stats from real data (will be populated from API)
const MOCK_STATS = {
  totalRevenue: 0,
  totalConversions: 0,
  conversionRate: 0,
};

function DashboardContent() {
  const searchParams = useSearchParams();
  const [showWelcome, setShowWelcome] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("30d");

  // Revenue data (will come from API in production)
  const MOCK_REVENUE = 0;

  useEffect(() => {
    if (searchParams.get("welcome") === "true") {
      setShowWelcome(true);
      setTimeout(() => setShowWelcome(false), 5000);
    }
  }, [searchParams]);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const [linksRes, productsRes] = await Promise.all([
          fetch("/api/links?limit=5"),
          fetch("/api/products?limit=50"),
        ]);

        const linksData = await linksRes.json();
        const productsData = await productsRes.json();

        // Calculate total clicks from all products
        const totalClicks = productsData.products?.reduce(
          (sum: number, p: any) => sum + (p.totalClicks || 0),
          0
        ) || 0;

        setStats({
          totalClicks,
          totalLinks: linksData.total || linksData.links?.length || 0,
          totalProducts: productsData.products?.length || 0,
          recentLinks: linksData.links || [],
        });
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  return (
    <div className="p-6 lg:p-8">
      {/* Welcome Toast */}
      {showWelcome && (
        <div className="fixed top-4 right-4 bg-[#13eca4] text-[#0a0a0a] px-4 py-2 rounded-lg z-50 font-medium">
          Welcome to Rackr!
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-white/60 mt-1">Track your links and revenue</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Time Period Selector */}
          <div className="flex items-center gap-1 p-1 rounded-lg bg-white/5 border border-white/10">
            {(["7d", "30d", "all"] as TimePeriod[]).map((period) => (
              <button
                key={period}
                onClick={() => setTimePeriod(period)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                  timePeriod === period
                    ? "bg-[#13eca4] text-[#0a0a0a]"
                    : "text-white/60 hover:text-white"
                )}
              >
                {period === "7d" ? "7 Days" : period === "30d" ? "30 Days" : "All Time"}
              </button>
            ))}
          </div>
          <Link href="/dashboard/links">
            <Button className="bg-[#13eca4] text-[#0a0a0a] hover:bg-[#0fd492]">
              <Plus className="w-4 h-4 mr-2" /> Create Link
            </Button>
          </Link>
        </div>
      </div>

      {/* Revenue/Clicks Pie Chart - Main Feature at TOP */}
      <div className="mb-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-24 bg-white/5 rounded-xl border border-white/10">
            <Loader2 className="w-10 h-10 animate-spin text-white/40" />
          </div>
        ) : (
          <RevenuePieChart
            creatorName="Your"
            totalRevenue={MOCK_REVENUE}
            totalClicks={stats?.totalClicks || 0}
            avatarFallback="U"
            size="large"
            showToggle={true}
            defaultView="clicks"
            isRevenueLocked={IS_FREE_TIER}
          />
        )}
      </div>

      {/* Stats Grid - Below the chart */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Revenue - Locked for free tier */}
        <div className="bg-white/5 rounded-xl p-6 border border-white/10 relative">
          <div className="flex items-center gap-2 text-white/60 mb-2">
            <DollarSign className="w-4 h-4" />
            <span className="text-sm">Revenue</span>
          </div>
          {IS_FREE_TIER ? (
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-white/40" />
              <span className="text-white/40">Connect Stripe</span>
            </div>
          ) : (
            <p className="text-2xl font-bold">${MOCK_STATS.totalRevenue.toLocaleString()}</p>
          )}
          {IS_FREE_TIER && (
            <Link href="/dashboard/settings/billing" className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity rounded-xl">
              <span className="text-xs text-[#13eca4] font-medium">Upgrade to unlock</span>
            </Link>
          )}
        </div>

        {/* Clicks - Available to all */}
        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <div className="flex items-center gap-2 text-white/60 mb-2">
            <Link2 className="w-4 h-4" />
            <span className="text-sm">Clicks</span>
          </div>
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin text-white/40" />
          ) : (
            <p className="text-2xl font-bold">{(stats?.totalClicks || 0).toLocaleString()}</p>
          )}
        </div>

        {/* Conversions - Locked for free tier */}
        <div className="bg-white/5 rounded-xl p-6 border border-white/10 relative">
          <div className="flex items-center gap-2 text-white/60 mb-2">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm">Conversions</span>
          </div>
          {IS_FREE_TIER ? (
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-white/40" />
              <span className="text-white/40">Upgrade</span>
            </div>
          ) : (
            <p className="text-2xl font-bold">{MOCK_STATS.totalConversions}</p>
          )}
          {IS_FREE_TIER && (
            <Link href="/dashboard/settings/billing" className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity rounded-xl">
              <span className="text-xs text-[#13eca4] font-medium">Upgrade to unlock</span>
            </Link>
          )}
        </div>

        {/* Conversion Rate - Locked for free tier */}
        <div className="bg-white/5 rounded-xl p-6 border border-white/10 relative">
          <div className="flex items-center gap-2 text-white/60 mb-2">
            <BarChart3 className="w-4 h-4" />
            <span className="text-sm">Conv. Rate</span>
          </div>
          {IS_FREE_TIER ? (
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-white/40" />
              <span className="text-white/40">Upgrade</span>
            </div>
          ) : (
            <p className="text-2xl font-bold">{MOCK_STATS.conversionRate}%</p>
          )}
          {IS_FREE_TIER && (
            <Link href="/dashboard/settings/billing" className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity rounded-xl">
              <span className="text-xs text-[#13eca4] font-medium">Upgrade to unlock</span>
            </Link>
          )}
        </div>
      </div>

      {/* Upsell Banner for Free Users */}
      {IS_FREE_TIER && (
        <div className="mb-8 rounded-xl border border-[#13eca4]/30 bg-gradient-to-r from-[#13eca4]/10 to-transparent p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-white mb-1">See which content makes you money</h3>
              <p className="text-sm text-white/60">
                Connect Stripe to track revenue attribution and unlock insights
              </p>
            </div>
            <Link href="/dashboard/settings/billing">
              <Button className="bg-[#13eca4] text-[#0a0a0a] hover:bg-[#0fd492]">
                Upgrade to Creator
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Recent Content with Embeds */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">Recent Content</h2>
          <Link href="/dashboard/links" className="text-sm text-[#13eca4] hover:underline">
            View all
          </Link>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12 bg-white/5 rounded-xl border border-white/10">
            <Loader2 className="w-6 h-6 animate-spin text-white/40" />
          </div>
        ) : stats?.recentLinks && stats.recentLinks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.recentLinks.map((link) => (
              <div key={link.id} className="rounded-xl bg-[#161B22] border border-white/10 overflow-hidden hover:border-white/20 transition-colors">
                {/* Embedded content or placeholder */}
                {link.sourceContentId && link.sourcePlatform ? (
                  <ContentEmbedCompact
                    platform={link.sourcePlatform}
                    contentId={link.sourceContentId}
                    embedUrl={getEmbedUrl(link.sourcePlatform, link.sourceContentId)}
                  />
                ) : (
                  <div className="h-48 bg-gradient-to-br from-[#1c2e28] to-[#0a1612] flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-3xl mb-2">
                        {link.platform === 'TWITTER' && '𝕏'}
                        {link.platform === 'YOUTUBE' && '▶️'}
                        {link.platform === 'INSTAGRAM' && '📷'}
                        {link.platform === 'TIKTOK' && '🎵'}
                        {!['TWITTER', 'YOUTUBE', 'INSTAGRAM', 'TIKTOK'].includes(link.platform) && '🔗'}
                      </div>
                      <span className="text-white/40 text-xs">{link.platform}</span>
                    </div>
                  </div>
                )}

                {/* Stats overlay */}
                <div className="p-4">
                  <h3 className="text-white font-medium text-sm truncate mb-2">
                    {link.sourceTitle || `${SHORT_DOMAIN}/${link.slug}`}
                  </h3>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-sm text-white/60">
                      ↗ {(link._count?.clicks || 0).toLocaleString()} clicks
                    </span>
                    {!IS_FREE_TIER ? (
                      <>
                        <span className="text-sm text-[#13eca4] font-medium">
                          ${link._count?.attributions || 0}
                        </span>
                        <span className="text-xs px-1.5 py-0.5 rounded bg-white/10 text-white/60">
                          {link._count?.clicks && link._count.clicks > 0
                            ? `${((link._count?.attributions || 0) / link._count.clicks * 100).toFixed(1)}% CVR`
                            : "0% CVR"}
                        </span>
                      </>
                    ) : (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-white/5 text-white/30 flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        CVR
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white/5 rounded-xl border border-white/10 p-8 text-center">
            <p className="text-white/40 text-sm">
              No content yet. <Link href="/dashboard/links" className="text-[#13eca4] hover:underline">Create your first link</Link>
            </p>
          </div>
        )}
      </div>

      {/* Recent Links Table (compact) */}
      <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="font-semibold">All Links</h2>
          <Link href="/dashboard/links" className="text-sm text-[#13eca4] hover:underline">
            Manage
          </Link>
        </div>
        <table className="w-full">
          <thead className="bg-white/5">
            <tr className="text-left text-white/60 text-sm">
              <th className="px-4 py-3">Link</th>
              <th className="px-4 py-3">Platform</th>
              <th className="px-4 py-3">Clicks</th>
              <th className="px-4 py-3">
                {IS_FREE_TIER ? (
                  <span className="flex items-center gap-1">
                    Revenue <Lock className="w-3 h-3" />
                  </span>
                ) : (
                  "Revenue"
                )}
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto text-white/40" />
                </td>
              </tr>
            ) : stats?.recentLinks && stats.recentLinks.length > 0 ? (
              stats.recentLinks.map((link) => (
                <tr key={link.id} className="border-t border-white/10 hover:bg-white/5">
                  <td className="px-4 py-3">
                    <code className="text-sm font-mono">{SHORT_DOMAIN}/{link.slug}</code>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-white/80">{link.platform}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm">{(link._count?.clicks || 0).toLocaleString()}</span>
                  </td>
                  <td className="px-4 py-3">
                    {IS_FREE_TIER ? (
                      <span className="text-white/40 text-sm">—</span>
                    ) : (
                      <span className="text-sm text-[#13eca4] font-medium">${link._count?.attributions || 0}</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-white/40 text-sm">
                  No links yet. <Link href="/dashboard/links" className="text-[#13eca4] hover:underline">Create your first link</Link>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Quick Actions for New Users */}
      {IS_FREE_TIER && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/dashboard/links"
            className="p-4 rounded-xl border border-white/10 bg-white/5 hover:border-white/20 transition-colors"
          >
            <Link2 className="w-6 h-6 text-[#13eca4] mb-2" />
            <h3 className="font-medium mb-1">Create your first link</h3>
            <p className="text-sm text-white/60">Start tracking clicks on your content</p>
          </Link>
          <Link
            href="/dashboard/guide"
            className="p-4 rounded-xl border border-white/10 bg-white/5 hover:border-white/20 transition-colors"
          >
            <BarChart3 className="w-6 h-6 text-[#13eca4] mb-2" />
            <h3 className="font-medium mb-1">Learn how Rackr works</h3>
            <p className="text-sm text-white/60">Step-by-step guide to get started</p>
          </Link>
          <Link
            href="/dashboard/settings/billing"
            className="p-4 rounded-xl border border-[#13eca4]/30 bg-[#13eca4]/5 hover:border-[#13eca4]/50 transition-colors"
          >
            <TrendingUp className="w-6 h-6 text-[#13eca4] mb-2" />
            <h3 className="font-medium mb-1">Unlock revenue tracking</h3>
            <p className="text-sm text-white/60">See which content makes you money</p>
          </Link>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
