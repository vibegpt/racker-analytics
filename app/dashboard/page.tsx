"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Link2, TrendingUp, DollarSign, BarChart3, Plus, Lock, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { SHORT_DOMAIN } from "@/lib/config";

interface SmartLink {
  id: string;
  slug: string;
  platform: string;
  createdAt: string;
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
const IS_FREE_TIER = true;

function DashboardContent() {
  const searchParams = useSearchParams();
  const [showWelcome, setShowWelcome] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
          Welcome to Racker!
        </div>
      )}

      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-white/60 mt-1">Track your links and revenue</p>
        </div>
        <Link href="/dashboard/links">
          <Button className="bg-[#13eca4] text-[#0a0a0a] hover:bg-[#0fd492]">
            <Plus className="w-4 h-4 mr-2" /> Create Link
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
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

      {/* Clicks by Platform - Main Feature Chart */}
      <div className="mb-8 bg-white/5 rounded-xl p-6 border border-white/10">
        <h2 className="text-lg font-semibold mb-4">Clicks by Platform</h2>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-white/40" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Twitter */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#1DA1F2]/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-[#1DA1F2]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-white">Twitter</span>
                  <span className="text-white/60">{Math.round((stats?.totalClicks || 0) * 0.45)} clicks</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-[#1DA1F2] rounded-full transition-all duration-500" style={{ width: '45%' }}></div>
                </div>
              </div>
            </div>
            {/* YouTube */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#FF0000]/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-[#FF0000]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-white">YouTube</span>
                  <span className="text-white/60">{Math.round((stats?.totalClicks || 0) * 0.30)} clicks</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-[#FF0000] rounded-full transition-all duration-500" style={{ width: '30%' }}></div>
                </div>
              </div>
            </div>
            {/* Instagram */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#E4405F]/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-[#E4405F]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-white">Instagram</span>
                  <span className="text-white/60">{Math.round((stats?.totalClicks || 0) * 0.15)} clicks</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#F58529] via-[#DD2A7B] to-[#8134AF] rounded-full transition-all duration-500" style={{ width: '15%' }}></div>
                </div>
              </div>
            </div>
            {/* TikTok */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-white">TikTok</span>
                  <span className="text-white/60">{Math.round((stats?.totalClicks || 0) * 0.10)} clicks</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-white rounded-full transition-all duration-500" style={{ width: '10%' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        {(stats?.totalClicks || 0) === 0 && !isLoading && (
          <p className="text-center text-white/40 text-sm py-4">
            No clicks yet. Create links and share them to start tracking!
          </p>
        )}
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

      {/* Recent Links */}
      <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="font-semibold">Recent Links</h2>
          <Link href="/dashboard/links" className="text-sm text-[#13eca4] hover:underline">
            View all
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
            <h3 className="font-medium mb-1">Learn how Racker works</h3>
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
