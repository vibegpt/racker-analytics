"use client";

import { useState } from "react";
import {
  Lightbulb,
  Clock,
  Globe,
  TrendingUp,
  Lock,
  ArrowRight,
  BarChart3,
  Smartphone,
  Monitor,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";

// TODO: Get from user context
const IS_FREE_TIER = true;

// Mock data for paid users
const MOCK_TIME_INSIGHTS = {
  bestHours: [
    { hour: 10, label: "10:00 AM", score: 0.85 },
    { hour: 14, label: "2:00 PM", score: 0.78 },
    { hour: 19, label: "7:00 PM", score: 0.72 },
  ],
  bestDays: [
    { day: "Tuesday", score: 0.82 },
    { day: "Thursday", score: 0.75 },
    { day: "Sunday", score: 0.68 },
  ],
};

const MOCK_PLATFORM_INSIGHTS = [
  { platform: "YouTube", clicks: 2450, conversions: 67, rate: 2.7, revenue: 3350, trend: 12 },
  { platform: "Twitter", clicks: 1890, conversions: 42, rate: 2.2, revenue: 2100, trend: -5 },
  { platform: "Newsletter", clicks: 920, conversions: 38, rate: 4.1, revenue: 1900, trend: 23 },
  { platform: "Instagram", clicks: 650, conversions: 12, rate: 1.8, revenue: 600, trend: 8 },
];

const MOCK_GEO_INSIGHTS = [
  { country: "United States", flag: "🇺🇸", clicks: 3200, conversions: 89, revenue: 4450 },
  { country: "United Kingdom", flag: "🇬🇧", clicks: 890, conversions: 24, revenue: 1200 },
  { country: "Germany", flag: "🇩🇪", clicks: 456, conversions: 18, revenue: 900 },
  { country: "Canada", flag: "🇨🇦", clicks: 312, conversions: 12, revenue: 600 },
];

const MOCK_DEVICE_INSIGHTS = [
  { device: "Mobile", icon: Smartphone, percentage: 68, clicks: 4080 },
  { device: "Desktop", icon: Monitor, percentage: 28, clicks: 1680 },
  { device: "Tablet", icon: Monitor, percentage: 4, clicks: 240 },
];

export default function InsightsPage() {
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d");

  if (IS_FREE_TIER) {
    return (
      <div className="p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Lightbulb className="w-6 h-6 text-[#13eca4]" />
              Insights
            </h1>
            <p className="text-white/60 mt-1">
              Discover patterns in your link performance
            </p>
          </div>

          {/* Locked State */}
          <div className="rounded-2xl border border-[#13eca4]/30 bg-gradient-to-b from-[#13eca4]/10 to-transparent p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#13eca4]/20 mb-6">
              <Lock className="w-8 h-8 text-[#13eca4]" />
            </div>
            <h2 className="text-xl font-bold mb-2">Unlock Insights with Creator</h2>
            <p className="text-white/60 mb-6 max-w-md mx-auto">
              See your best posting times, top performing platforms, audience geography, and revenue trends.
            </p>

            {/* Preview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-left">
                <Clock className="w-5 h-5 text-[#13eca4] mb-2" />
                <h3 className="font-medium mb-1">Best Times</h3>
                <p className="text-sm text-white/60">Know when your audience converts</p>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-left">
                <TrendingUp className="w-5 h-5 text-[#13eca4] mb-2" />
                <h3 className="font-medium mb-1">Platform ROI</h3>
                <p className="text-sm text-white/60">See which platforms drive revenue</p>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-left">
                <Globe className="w-5 h-5 text-[#13eca4] mb-2" />
                <h3 className="font-medium mb-1">Geo Insights</h3>
                <p className="text-sm text-white/60">Where your buyers come from</p>
              </div>
            </div>

            <Link href="/dashboard/settings/billing">
              <Button className="bg-[#13eca4] text-[#0a0a0a] hover:bg-[#0fd492]">
                Upgrade to Creator - $29/mo
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Paid user view
  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Lightbulb className="w-6 h-6 text-[#13eca4]" />
              Insights
            </h1>
            <p className="text-white/60 mt-1">
              Discover patterns in your link performance
            </p>
          </div>

          {/* Time Range Selector */}
          <div className="flex items-center gap-1 p-1 rounded-lg bg-white/5">
            {(["7d", "30d", "90d"] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                  timeRange === range
                    ? "bg-white/10 text-white"
                    : "text-white/60 hover:text-white"
                )}
              >
                {range === "7d" ? "7 days" : range === "30d" ? "30 days" : "90 days"}
              </button>
            ))}
          </div>
        </div>

        {/* Best Times Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-[#13eca4]" />
              <h2 className="font-semibold">Best Hours to Post</h2>
            </div>
            <div className="space-y-3">
              {MOCK_TIME_INSIGHTS.bestHours.map((item, i) => (
                <div key={item.hour} className="flex items-center gap-3">
                  <span className="text-lg font-bold text-[#13eca4] w-6">#{i + 1}</span>
                  <span className="text-sm font-medium w-20">{item.label}</span>
                  <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#13eca4] rounded-full"
                      style={{ width: `${item.score * 100}%` }}
                    />
                  </div>
                  <span className="text-sm text-white/60">{(item.score * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-[#13eca4]" />
              <h2 className="font-semibold">Best Days to Post</h2>
            </div>
            <div className="space-y-3">
              {MOCK_TIME_INSIGHTS.bestDays.map((item, i) => (
                <div key={item.day} className="flex items-center gap-3">
                  <span className="text-lg font-bold text-[#13eca4] w-6">#{i + 1}</span>
                  <span className="text-sm font-medium w-20">{item.day}</span>
                  <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#13eca4] rounded-full"
                      style={{ width: `${item.score * 100}%` }}
                    />
                  </div>
                  <span className="text-sm text-white/60">{(item.score * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Platform Performance */}
        <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
          <div className="p-4 border-b border-white/10 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#13eca4]" />
            <h2 className="font-semibold">Platform Performance</h2>
          </div>
          <table className="w-full">
            <thead className="bg-white/5">
              <tr className="text-left text-white/60 text-sm">
                <th className="px-4 py-3">Platform</th>
                <th className="px-4 py-3">Clicks</th>
                <th className="px-4 py-3">Conversions</th>
                <th className="px-4 py-3">Conv. Rate</th>
                <th className="px-4 py-3">Revenue</th>
                <th className="px-4 py-3">Trend</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_PLATFORM_INSIGHTS.map((platform) => (
                <tr key={platform.platform} className="border-t border-white/10">
                  <td className="px-4 py-3 font-medium">{platform.platform}</td>
                  <td className="px-4 py-3">{platform.clicks.toLocaleString()}</td>
                  <td className="px-4 py-3">{platform.conversions}</td>
                  <td className="px-4 py-3">{platform.rate}%</td>
                  <td className="px-4 py-3 text-[#13eca4] font-medium">
                    ${platform.revenue.toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "text-sm",
                        platform.trend > 0 ? "text-green-400" : "text-red-400"
                      )}
                    >
                      {platform.trend > 0 ? "+" : ""}
                      {platform.trend}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Geo & Device */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Geo */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="w-5 h-5 text-[#13eca4]" />
              <h2 className="font-semibold">Top Countries</h2>
            </div>
            <div className="space-y-3">
              {MOCK_GEO_INSIGHTS.map((item) => (
                <div key={item.country} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{item.flag}</span>
                    <span className="text-sm font-medium">{item.country}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-white/60">{item.clicks.toLocaleString()} clicks</span>
                    <span className="text-[#13eca4] font-medium">${item.revenue.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Device */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Smartphone className="w-5 h-5 text-[#13eca4]" />
              <h2 className="font-semibold">Device Breakdown</h2>
            </div>
            <div className="space-y-4">
              {MOCK_DEVICE_INSIGHTS.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.device} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-white/60" />
                        <span>{item.device}</span>
                      </div>
                      <span className="text-white/60">{item.percentage}%</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#13eca4] rounded-full"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
