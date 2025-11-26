"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Bell, Search, Menu, Link2, TrendingUp, DollarSign, BarChart3, ExternalLink, Plus, Youtube, Mail, MessageCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";

// Twitter/X icon
function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}

// Mock data
const MOCK_LINKS = [
  { id: 1, slug: "summer-drop", platform: "Twitter", clicks: 1247, conversions: 23, revenue: 1150 },
  { id: 2, slug: "yt-desc", platform: "YouTube", clicks: 892, conversions: 18, revenue: 900 },
  { id: 3, slug: "newsletter", platform: "Newsletter", clicks: 456, conversions: 12, revenue: 600 },
];

const MOCK_STATS = {
  totalRevenue: 2650,
  totalClicks: 2595,
  totalConversions: 53,
  conversionRate: 2.04,
};

const REVENUE_SOURCES = [
  { platform: "Twitter", percentage: 45, color: "#1DA1F2", icon: <TwitterIcon className="w-6 h-6" /> },
  { platform: "YouTube", percentage: 30, color: "#FF0000", icon: <Youtube className="w-6 h-6" /> },
  { platform: "Newsletter", percentage: 15, color: "#13eca4", icon: <Mail className="w-6 h-6" /> },
  { platform: "Discord", percentage: 10, color: "#5865F2", icon: <MessageCircle className="w-6 h-6" /> },
];

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    if (searchParams.get("welcome") === "true") {
      setShowWelcome(true);
      window.history.replaceState({}, "", "/dashboard");
    }
  }, [searchParams]);

  // Generate pie chart gradient
  const generateGradient = () => {
    let currentAngle = 0;
    const stops: string[] = [];
    
    REVENUE_SOURCES.forEach((source) => {
      const startAngle = currentAngle;
      const endAngle = currentAngle + source.percentage;
      stops.push(`${source.color} ${startAngle}% ${endAngle}%`);
      currentAngle = endAngle;
    });
    
    return `conic-gradient(${stops.join(", ")})`;
  };

  // Calculate label positions
  const getLabelPosition = (index: number) => {
    let cumulativePercent = 0;
    for (let i = 0; i < index; i++) {
      cumulativePercent += REVENUE_SOURCES[i].percentage;
    }
    const midPercent = cumulativePercent + REVENUE_SOURCES[index].percentage / 2;
    const angle = (midPercent / 100) * 360 - 90;
    const radius = 260; // Increased for larger pie
    
    const x = Math.cos((angle * Math.PI) / 180) * radius;
    const y = Math.sin((angle * Math.PI) / 180) * radius;
    
    return { x, y };
  };

  return (
    <div className="min-h-screen bg-[#0a1612] text-white font-sans">
      {/* Welcome Banner */}
      {showWelcome && (
        <div className="w-full bg-[#13eca4]/10 border-b border-[#13eca4]/30 py-3">
          <p className="text-center text-sm font-medium text-[#13eca4]">
            🎉 Welcome to Racker! Your first smart link is ready to share.
          </p>
        </div>
      )}

      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 w-full border-b border-[#283933] bg-[#0a1612]/90 backdrop-blur-xl">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 text-[#13eca4]">
              <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M4 42.4379C4 42.4379 14.0962 36.0744 24 41.1692C35.0664 46.8624 44 42.2078 44 42.2078L44 7.01134C44 7.01134 35.068 11.6577 24.0031 5.96913C14.0971 0.876274 4 7.27094 4 7.27094L4 42.4379Z"
                  fill="currentColor"
                />
              </svg>
            </div>
            <span className="font-bold text-xl tracking-tight text-white">
              Racker <span className="text-[#13eca4]">Analytics</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <Link href="/dashboard" className="text-white text-sm font-medium">Dashboard</Link>
            <Link href="/links" className="text-white/70 hover:text-white text-sm font-medium transition-colors">Links</Link>
            <Link href="/analytics" className="text-white/70 hover:text-white text-sm font-medium transition-colors">Analytics</Link>
            <Link href="/settings" className="text-white/70 hover:text-white text-sm font-medium transition-colors">Settings</Link>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="rounded-full text-white/70 hover:text-white hover:bg-[#283933]">
              <Search className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full relative text-white/70 hover:text-white hover:bg-[#283933]">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2 h-2 w-2 bg-[#13eca4] rounded-full border-2 border-[#0a1612]" />
            </Button>
            <Avatar className="h-8 w-8 border-2 border-[#283933] cursor-pointer hover:border-[#13eca4] transition-colors">
              <AvatarImage src="https://github.com/shadcn.png" />
              <AvatarFallback className="bg-[#283933] text-white">U</AvatarFallback>
            </Avatar>
            <Button variant="ghost" size="icon" className="md:hidden text-white/70 hover:text-white hover:bg-[#283933]">
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* HERO: Revenue Pie Chart */}
        <div className="relative rounded-2xl border border-[#283933] bg-gradient-to-b from-[#1c2e28]/80 to-[#0a1612] p-8 sm:p-12 mb-8 overflow-hidden">
          {/* Background glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#13eca4]/5 rounded-full blur-3xl pointer-events-none" />
          
          {/* Header - Just title */}
          <div className="text-center mb-4 relative z-10">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight uppercase">
              Your Brand
            </h1>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#13eca4] tracking-wide uppercase mt-2">
              Revenue Sources
            </h2>
          </div>

          {/* Pie Chart - Desktop */}
          <div className="hidden lg:flex relative justify-center items-center min-h-[600px]">
            {/* Labels */}
            {REVENUE_SOURCES.map((source, index) => {
              const pos = getLabelPosition(index);
              const isLeftSide = pos.x < 0;
              
              return (
                <div
                  key={source.platform}
                  className="absolute flex items-center gap-4 whitespace-nowrap z-10"
                  style={{
                    left: '50%',
                    top: '50%',
                    transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px))`,
                  }}
                >
                  {isLeftSide ? (
                    <>
                      <div className="text-right">
                        <p className="text-white font-bold text-xl">{source.platform}</p>
                        <p className="font-black text-4xl" style={{ color: source.color }}>{source.percentage}%</p>
                      </div>
                      <div 
                        className="w-16 h-16 rounded-xl flex items-center justify-center text-white shadow-lg"
                        style={{ backgroundColor: source.color, boxShadow: `0 0 40px ${source.color}50` }}
                      >
                        {source.icon}
                      </div>
                    </>
                  ) : (
                    <>
                      <div 
                        className="w-16 h-16 rounded-xl flex items-center justify-center text-white shadow-lg"
                        style={{ backgroundColor: source.color, boxShadow: `0 0 40px ${source.color}50` }}
                      >
                        {source.icon}
                      </div>
                      <div className="text-left">
                        <p className="text-white font-bold text-xl">{source.platform}</p>
                        <p className="font-black text-4xl" style={{ color: source.color }}>{source.percentage}%</p>
                      </div>
                    </>
                  )}
                </div>
              );
            })}

            {/* The Pie - BIGGER */}
            <div
              className="w-96 h-96 rounded-full relative"
              style={{ 
                background: generateGradient(),
                boxShadow: '0 0 100px rgba(19, 236, 164, 0.3), 0 0 150px rgba(19, 236, 164, 0.15)'
              }}
            >
              <div className="absolute inset-10 rounded-full bg-[#0a1612] flex items-center justify-center border-4 border-[#1c2e28]">
                <Avatar className="w-44 h-44 border-4 border-[#283933]">
                  <AvatarImage src="https://github.com/shadcn.png" />
                  <AvatarFallback className="bg-[#1c2e28] text-white text-5xl font-bold">YB</AvatarFallback>
                </Avatar>
              </div>
            </div>
          </div>

          {/* Pie Chart - Mobile/Tablet */}
          <div className="lg:hidden flex flex-col items-center gap-8 mt-8">
            <div
              className="w-64 h-64 sm:w-80 sm:h-80 rounded-full relative"
              style={{ 
                background: generateGradient(),
                boxShadow: '0 0 80px rgba(19, 236, 164, 0.3)'
              }}
            >
              <div className="absolute inset-8 sm:inset-10 rounded-full bg-[#0a1612] flex items-center justify-center border-4 border-[#1c2e28]">
                <Avatar className="w-28 h-28 sm:w-36 sm:h-36 border-4 border-[#283933]">
                  <AvatarImage src="https://github.com/shadcn.png" />
                  <AvatarFallback className="bg-[#1c2e28] text-white text-3xl font-bold">YB</AvatarFallback>
                </Avatar>
              </div>
            </div>

            {/* Mobile Legend */}
            <div className="grid grid-cols-2 gap-4 w-full max-w-md">
              {REVENUE_SOURCES.map((source) => (
                <div 
                  key={source.platform} 
                  className="flex items-center gap-3 p-4 rounded-xl bg-[#1c2e28]/50 border border-[#283933]"
                >
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white flex-shrink-0"
                    style={{ backgroundColor: source.color }}
                  >
                    {source.icon}
                  </div>
                  <div>
                    <p className="text-white/80 text-sm">{source.platform}</p>
                    <p className="font-black text-xl" style={{ color: source.color }}>{source.percentage}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Total Revenue - Below Pie Chart */}
          <div className="flex justify-center mt-8 relative z-10">
            <div className="inline-flex items-center gap-4 px-8 py-4 rounded-xl border border-[#283933] bg-[#0a1612]/80">
              <span className="text-white/60 text-lg">Total Revenue:</span>
              <span className="text-[#13eca4] font-black text-4xl">${MOCK_STATS.totalRevenue.toLocaleString()}</span>
              <span className="text-sm text-[#13eca4] bg-[#13eca4]/20 px-3 py-1 rounded-full font-bold">+12%</span>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="rounded-xl border border-[#283933] bg-[#1c2e28]/50 p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-[#13eca4]/10">
                <DollarSign className="h-5 w-5 text-[#13eca4]" />
              </div>
              <span className="text-white/60 text-sm">Total Revenue</span>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-white">${MOCK_STATS.totalRevenue.toLocaleString()}</p>
            <p className="text-xs text-[#13eca4] mt-1">+12% from last week</p>
          </div>

          <div className="rounded-xl border border-[#283933] bg-[#1c2e28]/50 p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Link2 className="h-5 w-5 text-blue-400" />
              </div>
              <span className="text-white/60 text-sm">Total Clicks</span>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-white">{MOCK_STATS.totalClicks.toLocaleString()}</p>
            <p className="text-xs text-blue-400 mt-1">+8% from last week</p>
          </div>

          <div className="rounded-xl border border-[#283933] bg-[#1c2e28]/50 p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <TrendingUp className="h-5 w-5 text-purple-400" />
              </div>
              <span className="text-white/60 text-sm">Conversions</span>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-white">{MOCK_STATS.totalConversions}</p>
            <p className="text-xs text-purple-400 mt-1">+15% from last week</p>
          </div>

          <div className="rounded-xl border border-[#283933] bg-[#1c2e28]/50 p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <BarChart3 className="h-5 w-5 text-amber-400" />
              </div>
              <span className="text-white/60 text-sm">Conv. Rate</span>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-white">{MOCK_STATS.conversionRate}%</p>
            <p className="text-xs text-amber-400 mt-1">+0.3% from last week</p>
          </div>
        </div>

        {/* Top Links & Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Links Table */}
          <div className="rounded-xl border border-[#283933] bg-[#1c2e28]/30 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Top Performing Links</h2>
              <Link href="/links" className="text-sm text-[#13eca4] hover:underline font-medium flex items-center gap-1">
                View All <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
            
            <div className="space-y-3">
              {MOCK_LINKS.map((link) => (
                <div key={link.id} className="flex items-center justify-between p-4 rounded-lg bg-[#0a1612] border border-[#283933]/50 hover:border-[#13eca4]/30 transition-colors">
                  <div>
                    <code className="text-[#13eca4] font-medium">rckr.co/{link.slug}</code>
                    <p className="text-white/50 text-sm mt-1">{link.platform} • {link.clicks.toLocaleString()} clicks</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[#13eca4] font-bold text-lg">${link.revenue}</p>
                    <p className="text-white/50 text-sm">{link.conversions} sales</p>
                  </div>
                </div>
              ))}
            </div>

            <Link href="/links">
              <Button className="w-full mt-4 rounded-lg bg-[#283933] hover:bg-[#3b544b] text-white gap-2">
                <Plus className="h-4 w-4" />
                Create New Link
              </Button>
            </Link>
          </div>

          {/* Recent Activity */}
          <div className="rounded-xl border border-[#283933] bg-[#1c2e28]/30 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Recent Activity</h2>
            </div>
            
            <div className="space-y-3">
              {[
                { type: "sale", message: "New sale from Twitter link", amount: "$50", time: "2 min ago" },
                { type: "click", message: "100 clicks on 'summer-drop'", amount: null, time: "15 min ago" },
                { type: "sale", message: "New sale from YouTube link", amount: "$75", time: "1 hour ago" },
                { type: "link", message: "New link created: newsletter-cta", amount: null, time: "3 hours ago" },
                { type: "sale", message: "New sale from Newsletter", amount: "$25", time: "5 hours ago" },
              ].map((activity, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-[#0a1612] border border-[#283933]/50">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      activity.type === "sale" ? "bg-[#13eca4]/10" : 
                      activity.type === "click" ? "bg-blue-500/10" : "bg-purple-500/10"
                    }`}>
                      {activity.type === "sale" ? <DollarSign className="h-4 w-4 text-[#13eca4]" /> :
                       activity.type === "click" ? <TrendingUp className="h-4 w-4 text-blue-400" /> :
                       <Link2 className="h-4 w-4 text-purple-400" />}
                    </div>
                    <div>
                      <p className="text-sm text-white">{activity.message}</p>
                      <p className="text-xs text-white/50">{activity.time}</p>
                    </div>
                  </div>
                  {activity.amount && (
                    <span className="text-lg font-bold text-[#13eca4]">{activity.amount}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}