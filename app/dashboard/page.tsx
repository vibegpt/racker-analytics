"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Link2, TrendingUp, DollarSign, BarChart3, Plus, Lock, ArrowRight } from "lucide-react";
import Link from "next/link";
import { SHORT_DOMAIN } from "@/lib/config";

const MOCK_LINKS = [
  { id: 1, slug: "summer-drop", platform: "Twitter", clicks: 1247, conversions: 23, revenue: 1150 },
  { id: 2, slug: "yt-desc", platform: "YouTube", clicks: 892, conversions: 18, revenue: 900 },
  { id: 3, slug: "newsletter-link", platform: "Newsletter", clicks: 456, conversions: 12, revenue: 600 },
];

const MOCK_STATS = { totalRevenue: 2650, totalClicks: 2595, totalConversions: 53, conversionRate: 2.04 };

// TODO: Get from user context
const IS_FREE_TIER = true;

function DashboardContent() {
  const searchParams = useSearchParams();
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    if (searchParams.get("welcome") === "true") {
      setShowWelcome(true);
      setTimeout(() => setShowWelcome(false), 5000);
    }
  }, [searchParams]);

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
          <p className="text-2xl font-bold">{MOCK_STATS.totalClicks.toLocaleString()}</p>
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
            {MOCK_LINKS.map((link) => (
              <tr key={link.id} className="border-t border-white/10 hover:bg-white/5">
                <td className="px-4 py-3">
                  <code className="text-sm font-mono">{SHORT_DOMAIN}/{link.slug}</code>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-white/80">{link.platform}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm">{link.clicks.toLocaleString()}</span>
                </td>
                <td className="px-4 py-3">
                  {IS_FREE_TIER ? (
                    <span className="text-white/40 text-sm">—</span>
                  ) : (
                    <span className="text-sm text-[#13eca4] font-medium">${link.revenue}</span>
                  )}
                </td>
              </tr>
            ))}
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
