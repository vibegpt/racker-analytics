"use client";

import { ProjectStats } from "@/lib/mock-data";
import { TrendingUp, TrendingDown, Users, BarChart3, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

interface CoinStatsBarProps {
    stats: ProjectStats;
}

export function CoinStatsBar({ stats }: CoinStatsBarProps) {
    const isPositive = stats.priceChange24h >= 0;

    return (
        <div className="w-full bg-background/80 backdrop-blur-md border-b border-border/60 sticky top-16 z-40 overflow-x-auto no-scrollbar">
            <div className="container mx-auto px-4 h-12 flex items-center justify-between gap-6 min-w-max">

                {/* Ticker / Symbol */}
                <div className="flex items-center gap-3 pr-6 border-r border-border/60">
                    <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-white">
                        {stats.coinSymbol[1]}
                    </div>
                    <span className="font-bold text-lg tracking-tight">{stats.coinSymbol}</span>
                    <span className="text-sm text-muted-foreground hidden sm:inline-block">{stats.coinName}</span>
                </div>

                {/* Price & Change */}
                <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Price</span>
                        <div className="flex items-center gap-2">
                            <span className="font-mono font-bold">${stats.price.toFixed(4)}</span>
                            <span className={cn(
                                "text-xs font-medium px-1.5 py-0.5 rounded flex items-center",
                                isPositive ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                            )}>
                                {isPositive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                                {Math.abs(stats.priceChange24h)}%
                            </span>
                        </div>
                    </div>
                </div>

                {/* Market Cap */}
                <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Market Cap</span>
                    <span className="font-mono font-bold flex items-center gap-1">
                        <DollarSign className="w-3 h-3 text-muted-foreground" />
                        {(stats.marketCap / 1000000).toFixed(2)}M
                    </span>
                </div>

                {/* Volume */}
                <div className="flex flex-col hidden sm:flex">
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">24h Vol</span>
                    <span className="font-mono font-bold flex items-center gap-1">
                        <BarChart3 className="w-3 h-3 text-muted-foreground" />
                        ${(stats.volume24h / 1000).toFixed(1)}K
                    </span>
                </div>

                {/* Holders */}
                <div className="flex flex-col hidden md:flex">
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Holders</span>
                    <span className="font-mono font-bold flex items-center gap-1">
                        <Users className="w-3 h-3 text-muted-foreground" />
                        {stats.holders.toLocaleString()}
                    </span>
                </div>

            </div>
        </div>
    );
}
