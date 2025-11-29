"use client";

import { Youtube, Mail, MessageCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Twitter/X icon
function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}

interface RevenueSource {
  platform: string;
  percentage: number;
  color: string;
  icon: React.ReactNode;
}

interface RevenuePieChartProps {
  creatorName: string;
  totalRevenue: number;
  avatarUrl?: string;
  avatarFallback?: string;
  sources?: RevenueSource[];
  subtitle?: string;
  valueLabel?: string;
  valuePrefix?: string;
  size?: "default" | "large";
}

const DEFAULT_SOURCES: RevenueSource[] = [
  { platform: "Twitter", percentage: 45, color: "#1DA1F2", icon: <TwitterIcon className="w-5 h-5" /> },
  { platform: "YouTube", percentage: 30, color: "#FF0000", icon: <Youtube className="w-5 h-5" /> },
  { platform: "Newsletter", percentage: 15, color: "#13eca4", icon: <Mail className="w-5 h-5" /> },
  { platform: "Discord", percentage: 10, color: "#5865F2", icon: <MessageCircle className="w-5 h-5" /> },
];

export function RevenuePieChart({
  creatorName,
  totalRevenue,
  avatarUrl,
  avatarFallback = "U",
  sources = DEFAULT_SOURCES,
  subtitle = "Revenue Sources",
  valueLabel = "Total Revenue:",
  valuePrefix = "$",
  size = "default",
}: RevenuePieChartProps) {
  const isLarge = size === "large";
  // Calculate conic gradient stops
  const generateGradient = () => {
    let currentAngle = 0;
    const stops: string[] = [];
    
    sources.forEach((source) => {
      const startAngle = currentAngle;
      const endAngle = currentAngle + source.percentage;
      stops.push(`${source.color} ${startAngle}% ${endAngle}%`);
      currentAngle = endAngle;
    });
    
    return `conic-gradient(${stops.join(", ")})`;
  };

  // Calculate label positions around the pie
  const getLabelPosition = (index: number) => {
    let cumulativePercent = 0;
    for (let i = 0; i < index; i++) {
      cumulativePercent += sources[i].percentage;
    }
    const midPercent = cumulativePercent + sources[index].percentage / 2;
    const angle = (midPercent / 100) * 360 - 90; // -90 to start from top
    const radius = isLarge ? 220 : 160; // Distance from center - larger for big chart

    const x = Math.cos((angle * Math.PI) / 180) * radius;
    const y = Math.sin((angle * Math.PI) / 180) * radius;

    return { x, y };
  };

  return (
    <div className="w-full rounded-xl border border-[#283933] bg-[#0a1612] p-6 sm:p-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight uppercase">
          {creatorName}
        </h2>
        <h3 className="text-xl sm:text-2xl font-bold text-[#13eca4] tracking-wide uppercase mt-1">
          {subtitle}
        </h3>
        <div className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded border border-[#283933] bg-[#1c2e28]">
          <span className="text-white/60 text-sm">{valueLabel}</span>
          <span className="text-[#13eca4] font-bold text-lg">{valuePrefix}{totalRevenue.toLocaleString()}</span>
        </div>
      </div>

      {/* Pie Chart Container - Desktop */}
      <div className={`hidden sm:flex relative justify-center items-center py-12 ${isLarge ? 'min-h-[520px]' : 'min-h-[400px]'}`}>
        {/* Labels positioned around the pie */}
        {sources.map((source, index) => {
          const pos = getLabelPosition(index);
          const isLeftSide = pos.x < 0;
          
          return (
            <div
              key={source.platform}
              className="absolute flex items-center gap-3 whitespace-nowrap"
              style={{
                left: '50%',
                top: '50%',
                transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px))`,
              }}
            >
              {isLeftSide ? (
                <>
                  <div className="text-right">
                    <p className="text-white font-bold text-base">{source.platform}</p>
                    <p className="font-black text-xl" style={{ color: source.color }}>{source.percentage}%</p>
                  </div>
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white shadow-lg"
                    style={{ backgroundColor: source.color }}
                  >
                    {source.icon}
                  </div>
                </>
              ) : (
                <>
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white shadow-lg"
                    style={{ backgroundColor: source.color }}
                  >
                    {source.icon}
                  </div>
                  <div className="text-left">
                    <p className="text-white font-bold text-base">{source.platform}</p>
                    <p className="font-black text-xl" style={{ color: source.color }}>{source.percentage}%</p>
                  </div>
                </>
              )}
            </div>
          );
        })}

        {/* Pie Chart */}
        <div
          className={`${isLarge ? 'w-80 h-80' : 'w-56 h-56'} rounded-full relative shadow-2xl`}
          style={{
            background: generateGradient(),
            boxShadow: '0 0 60px rgba(19, 236, 164, 0.2)'
          }}
        >
          {/* Inner circle with avatar */}
          <div className={`absolute ${isLarge ? 'inset-8' : 'inset-6'} rounded-full bg-[#0a1612] flex items-center justify-center border-4 border-[#1c2e28]`}>
            <Avatar className={`${isLarge ? 'w-40 h-40' : 'w-28 h-28'} border-4 border-[#283933]`}>
              <AvatarImage src={avatarUrl} />
              <AvatarFallback className={`bg-[#1c2e28] text-white ${isLarge ? 'text-5xl' : 'text-3xl'} font-bold`}>
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
          className="w-48 h-48 rounded-full relative shadow-2xl"
          style={{ 
            background: generateGradient(),
            boxShadow: '0 0 40px rgba(19, 236, 164, 0.2)'
          }}
        >
          {/* Inner circle with avatar */}
          <div className="absolute inset-5 rounded-full bg-[#0a1612] flex items-center justify-center border-4 border-[#1c2e28]">
            <Avatar className="w-20 h-20 border-2 border-[#283933]">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback className="bg-[#1c2e28] text-white text-2xl font-bold">
                {avatarFallback}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 gap-3 w-full">
          {sources.map((source) => (
            <div 
              key={source.platform} 
              className="flex items-center gap-3 p-3 rounded-lg bg-[#1c2e28]/50"
            >
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white flex-shrink-0"
                style={{ backgroundColor: source.color }}
              >
                {source.icon}
              </div>
              <div>
                <p className="text-white/80 text-sm">{source.platform}</p>
                <p className="font-bold" style={{ color: source.color }}>{source.percentage}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}