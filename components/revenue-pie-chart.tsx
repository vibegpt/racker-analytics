"use client";

import { useState } from "react";
import { Youtube, Mail, MessageCircle, MousePointer, DollarSign } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

// Twitter/X icon
function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}

// Instagram icon
function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  );
}

// TikTok icon
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
    </svg>
  );
}

export interface RevenueSource {
  platform: string;
  percentage: number;
  revenuePercentage?: number; // Optional revenue percentage for toggle
  color: string;
  icon: React.ReactNode;
}

type ViewMode = "clicks" | "revenue";

interface RevenuePieChartProps {
  creatorName: string;
  totalRevenue: number;
  totalClicks?: number;
  avatarUrl?: string;
  avatarFallback?: string;
  sources?: RevenueSource[];
  subtitle?: string;
  valueLabel?: string;
  valuePrefix?: string;
  size?: "default" | "large";
  showToggle?: boolean;
  defaultView?: ViewMode;
  isRevenueLocked?: boolean;
  hideHeader?: boolean;
  hideStats?: boolean;
}

const DEFAULT_SOURCES: RevenueSource[] = [
  { platform: "Twitter", percentage: 45, revenuePercentage: 52, color: "#1DA1F2", icon: <TwitterIcon className="w-6 h-6" /> },
  { platform: "YouTube", percentage: 30, revenuePercentage: 28, color: "#FF0000", icon: <Youtube className="w-6 h-6" /> },
  { platform: "TikTok", percentage: 8, revenuePercentage: 8, color: "#000000", icon: <TikTokIcon className="w-6 h-6" /> },
  { platform: "Instagram", percentage: 15, revenuePercentage: 12, color: "#E4405F", icon: <InstagramIcon className="w-6 h-6" /> },
];

export function RevenuePieChart({
  creatorName,
  totalRevenue,
  totalClicks,
  avatarUrl,
  avatarFallback = "U",
  sources = DEFAULT_SOURCES,
  subtitle = "Revenue Sources",
  valueLabel = "Total Revenue:",
  valuePrefix = "$",
  size = "default",
  showToggle = false,
  defaultView = "clicks",
  isRevenueLocked = false,
  hideHeader = false,
  hideStats = false,
}: RevenuePieChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>(defaultView);

  // Get the appropriate percentage based on view mode
  const getPercentage = (source: RevenueSource) => {
    if (viewMode === "revenue" && source.revenuePercentage !== undefined) {
      return source.revenuePercentage;
    }
    return source.percentage;
  };

  // Calculate sources with current view percentages
  const displaySources = sources.map(source => ({
    ...source,
    percentage: getPercentage(source),
  }));

  // Dynamic labels based on view mode
  const currentValueLabel = viewMode === "clicks" ? "Total Clicks:" : "Total Revenue:";
  const currentValuePrefix = viewMode === "clicks" ? "" : "$";
  const currentValue = viewMode === "clicks"
    ? (totalClicks ?? totalRevenue)
    : totalRevenue;
  const currentSubtitle = viewMode === "clicks" ? "Clicks by Platform" : "Revenue by Platform";
  const isLarge = size === "large";
  const chartSize = isLarge ? 380 : 280;
  const ringThickness = isLarge ? 70 : 50;
  const innerRadius = (chartSize / 2) - ringThickness;

  // Calculate conic gradient stops
  const generateGradient = () => {
    let currentAngle = 0;
    const stops: string[] = [];

    displaySources.forEach((source) => {
      const startAngle = currentAngle;
      const endAngle = currentAngle + source.percentage;
      stops.push(`${source.color} ${startAngle}% ${endAngle}%`);
      currentAngle = endAngle;
    });

    return `conic-gradient(${stops.join(", ")})`;
  };

  // Calculate icon positions INSIDE the donut ring
  const getIconPosition = (index: number) => {
    let cumulativePercent = 0;
    for (let i = 0; i < index; i++) {
      cumulativePercent += displaySources[i].percentage;
    }
    const midPercent = cumulativePercent + displaySources[index].percentage / 2;
    const angle = (midPercent / 100) * 360 - 90;
    // Position in the middle of the ring
    const radius = (chartSize / 2) - (ringThickness / 2);

    const x = Math.cos((angle * Math.PI) / 180) * radius;
    const y = Math.sin((angle * Math.PI) / 180) * radius;

    return { x, y, angle };
  };

  // Calculate external label positions
  const getLabelPosition = (index: number) => {
    let cumulativePercent = 0;
    for (let i = 0; i < index; i++) {
      cumulativePercent += displaySources[i].percentage;
    }
    const midPercent = cumulativePercent + displaySources[index].percentage / 2;
    const angle = (midPercent / 100) * 360 - 90;
    const radius = isLarge ? 250 : 185;

    const x = Math.cos((angle * Math.PI) / 180) * radius;
    const y = Math.sin((angle * Math.PI) / 180) * radius;

    return { x, y, isLeft: x < 0 };
  };

  return (
    <div className="w-full rounded-xl bg-[#0a0a0a] p-6 sm:p-8">
      {/* Header - Carbon Finance Style */}
      {!hideHeader && (
        <div className="text-center mb-2">
          <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight uppercase">
            {creatorName}
          </h2>
          <h3 className="text-2xl sm:text-3xl font-black text-[#13eca4] tracking-tight uppercase">
            {showToggle ? currentSubtitle : subtitle}
          </h3>
        </div>
      )}

      {/* Toggle + Stats Row */}
      {!hideStats && (
        <div className="flex justify-between items-center mb-6 px-2">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-[#1c2e28] border border-[#283933]">
            <span className="text-white/80 text-sm font-medium">
              {showToggle ? currentValueLabel : valueLabel}
            </span>
            <span className="text-[#13eca4] font-black text-lg">
              {showToggle ? `${currentValuePrefix}${currentValue.toLocaleString()}` : `${valuePrefix}${totalRevenue.toLocaleString()}`}
            </span>
          </div>

          {/* Clicks/Revenue Toggle */}
          {showToggle && (
            <div className="flex items-center gap-1 p-1 rounded-lg bg-[#1c2e28] border border-[#283933]">
              <button
                onClick={() => setViewMode("clicks")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                  viewMode === "clicks"
                    ? "bg-[#13eca4] text-[#0a0a0a]"
                    : "text-white/60 hover:text-white"
                )}
              >
                <MousePointer className="w-3.5 h-3.5" />
                Clicks
              </button>
              <button
                onClick={() => !isRevenueLocked && setViewMode("revenue")}
                disabled={isRevenueLocked}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                  viewMode === "revenue"
                    ? "bg-[#13eca4] text-[#0a0a0a]"
                    : isRevenueLocked
                      ? "text-white/30 cursor-not-allowed"
                      : "text-white/60 hover:text-white"
                )}
              >
                <DollarSign className="w-3.5 h-3.5" />
                Revenue
                {isRevenueLocked && <span className="text-xs">(Pro)</span>}
              </button>
            </div>
          )}

          {!showToggle && (
            <div className="hidden sm:block text-xs text-white/40">
              rackr.co
            </div>
          )}
        </div>
      )}

      {/* Pie Chart Container - Desktop */}
      <div className={`hidden sm:flex relative justify-center items-center ${isLarge ? 'min-h-[580px]' : 'min-h-[450px]'}`}>
        {/* External Labels */}
        {displaySources.map((source, index) => {
          const pos = getLabelPosition(index);

          return (
            <div
              key={`label-${source.platform}`}
              className="absolute whitespace-nowrap"
              style={{
                left: '50%',
                top: '50%',
                transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px))`,
              }}
            >
              <div className={`flex flex-col ${pos.isLeft ? 'items-end text-right' : 'items-start text-left'}`}>
                <span className="text-white/80 text-sm font-medium">{source.platform}</span>
                <span className="font-black text-xl" style={{ color: source.color === "#000000" ? "#ffffff" : source.color }}>
                  {source.percentage}%
                </span>
              </div>
            </div>
          );
        })}

        {/* Pie Chart */}
        <div
          className="rounded-full relative"
          style={{
            width: chartSize,
            height: chartSize,
            background: generateGradient(),
            boxShadow: '0 0 80px rgba(19, 236, 164, 0.15)'
          }}
        >
          {/* Icons positioned ON the donut segments */}
          {displaySources.map((source, index) => {
            const pos = getIconPosition(index);
            const iconSize = isLarge ? 44 : 36;

            return (
              <div
                key={`icon-${source.platform}`}
                className="absolute flex items-center justify-center rounded-lg text-white"
                style={{
                  width: iconSize,
                  height: iconSize,
                  left: '50%',
                  top: '50%',
                  transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px))`,
                  backgroundColor: 'rgba(0,0,0,0.3)',
                  backdropFilter: 'blur(4px)',
                }}
              >
                {source.icon}
              </div>
            );
          })}

          {/* Inner circle with avatar */}
          <div
            className="absolute rounded-full bg-[#0a0a0a] flex items-center justify-center"
            style={{
              width: innerRadius * 2,
              height: innerRadius * 2,
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          >
            <Avatar
              className="border-4 border-[#1c2e28]"
              style={{
                width: innerRadius * 1.6,
                height: innerRadius * 1.6,
              }}
            >
              <AvatarImage src={avatarUrl} />
              <AvatarFallback
                className="bg-[#1c2e28] text-white font-bold"
                style={{ fontSize: isLarge ? '4rem' : '2.5rem' }}
              >
                {avatarFallback}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>

      {/* Pie Chart Container - Mobile */}
      <div className="sm:hidden flex flex-col items-center gap-6">
        {/* Pie Chart */}
        <div
          className="w-56 h-56 rounded-full relative"
          style={{
            background: generateGradient(),
            boxShadow: '0 0 40px rgba(19, 236, 164, 0.15)'
          }}
        >
          {/* Icons on segments - mobile */}
          {displaySources.map((source, index) => {
            let cumulativePercent = 0;
            for (let i = 0; i < index; i++) {
              cumulativePercent += displaySources[i].percentage;
            }
            const midPercent = cumulativePercent + displaySources[index].percentage / 2;
            const angle = (midPercent / 100) * 360 - 90;
            const radius = 85;
            const x = Math.cos((angle * Math.PI) / 180) * radius;
            const y = Math.sin((angle * Math.PI) / 180) * radius;

            return (
              <div
                key={`icon-mobile-${source.platform}`}
                className="absolute flex items-center justify-center w-8 h-8 rounded-md text-white"
                style={{
                  left: '50%',
                  top: '50%',
                  transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                  backgroundColor: 'rgba(0,0,0,0.4)',
                }}
              >
                {source.icon}
              </div>
            );
          })}

          {/* Inner circle with avatar */}
          <div className="absolute inset-12 rounded-full bg-[#0a0a0a] flex items-center justify-center">
            <Avatar className="w-24 h-24 border-2 border-[#1c2e28]">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback className="bg-[#1c2e28] text-white text-3xl font-bold">
                {avatarFallback}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        {/* Legend - Mobile */}
        <div className="grid grid-cols-2 gap-3 w-full">
          {displaySources.map((source) => (
            <div
              key={source.platform}
              className="flex items-center gap-3 p-3 rounded-lg bg-[#111]/50"
            >
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: source.color }}
              />
              <div className="min-w-0">
                <p className="text-white/70 text-sm truncate">{source.platform}</p>
                <p className="font-black text-sm" style={{ color: source.color === "#000000" ? "#ffffff" : source.color }}>
                  {source.percentage}%
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
