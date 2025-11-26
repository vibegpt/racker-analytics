"use client";

import dynamic from "next/dynamic";

// Force dynamic rendering to avoid SSR issues with useSearchParams
export const dynamic_config = "force-dynamic";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Bell, Link2, TrendingUp, DollarSign, BarChart3, Plus } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";

const MOCK_LINKS = [
  { id: 1, slug: "summer-drop", platform: "Twitter", clicks: 1247, conversions: 23, revenue: 1150 },
  { id: 2, slug: "yt-desc", platform: "YouTube", clicks: 892, conversions: 18, revenue: 900 },
];

const MOCK_STATS = { totalRevenue: 2650, totalClicks: 2595, totalConversions: 53, conversionRate: 2.04 };

function DashboardInner() {
  const searchParams = useSearchParams();
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    if (searchParams.get("welcome") === "true") {
      setShowWelcome(true);
      setTimeout(() => setShowWelcome(false), 5000);
    }
  }, [searchParams]);

  return (
    <>
      {showWelcome && <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg z-50">Welcome!</div>}
      <header className="border-b border-white/10 px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-xl font-bold">Racker</Link>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon"><Bell className="w-5 h-5" /></Button>
            <Avatar><AvatarFallback>U</AvatarFallback></Avatar>
          </div>
        </div>
      </header>
      <main className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <Link href="/onboarding"><Button className="bg-white text-black hover:bg-white/90"><Plus className="w-4 h-4 mr-2" /> Create Link</Button></Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/5 rounded-xl p-6 border border-white/10"><div className="flex items-center gap-2 text-white/60 mb-2"><DollarSign className="w-4 h-4" /><span className="text-sm">Revenue</span></div><p className="text-2xl font-bold">${MOCK_STATS.totalRevenue}</p></div>
          <div className="bg-white/5 rounded-xl p-6 border border-white/10"><div className="flex items-center gap-2 text-white/60 mb-2"><Link2 className="w-4 h-4" /><span className="text-sm">Clicks</span></div><p className="text-2xl font-bold">{MOCK_STATS.totalClicks}</p></div>
          <div className="bg-white/5 rounded-xl p-6 border border-white/10"><div className="flex items-center gap-2 text-white/60 mb-2"><TrendingUp className="w-4 h-4" /><span className="text-sm">Conversions</span></div><p className="text-2xl font-bold">{MOCK_STATS.totalConversions}</p></div>
          <div className="bg-white/5 rounded-xl p-6 border border-white/10"><div className="flex items-center gap-2 text-white/60 mb-2"><BarChart3 className="w-4 h-4" /><span className="text-sm">Rate</span></div><p className="text-2xl font-bold">{MOCK_STATS.conversionRate}%</p></div>
        </div>
        <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
          <div className="p-4 border-b border-white/10"><h2 className="font-semibold">Your Links</h2></div>
          <table className="w-full"><thead className="bg-white/5"><tr className="text-left text-white/60 text-sm"><th className="px-4 py-3">Link</th><th className="px-4 py-3">Clicks</th><th className="px-4 py-3">Revenue</th></tr></thead>
            <tbody>{MOCK_LINKS.map((l) => <tr key={l.id} className="border-t border-white/10"><td className="px-4 py-3 font-mono text-sm">rackr.co/{l.slug}</td><td className="px-4 py-3">{l.clicks}</td><td className="px-4 py-3">${l.revenue}</td></tr>)}</tbody>
          </table>
        </div>
      </main>
    </>
  );
}

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
        <DashboardInner />
      </Suspense>
    </div>
  );
}
