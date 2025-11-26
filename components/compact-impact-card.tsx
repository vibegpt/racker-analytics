"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Eye, TrendingUp, Play } from "lucide-react";
import { StreamData } from "@/lib/mock-data";
import Link from "next/link";

interface CompactImpactCardProps {
    data: StreamData;
}

export function CompactImpactCard({ data }: CompactImpactCardProps) {
    // Determine the profile URL based on the creator address or name
    const profileUrl = data.creatorAddress
        ? `/${data.creatorAddress}`
        : `/${data.streamerName.toLowerCase().replace(/\s+/g, '_')}`;

    return (
        <Card className="overflow-hidden border border-border/50 hover:border-primary/50 transition-all duration-300 h-full flex flex-col">
            {/* Thumbnail with Play Overlay - Links to Story Page */}
            <Link href={`/story/${data.id}`} className="block">
                <div className="relative aspect-video bg-muted overflow-hidden group cursor-pointer">
                    <img
                        src={data.streamThumbnail}
                        alt={data.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                    {/* Play Button Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="bg-primary/90 backdrop-blur-sm p-3 rounded-full">
                            <Play className="w-6 h-6 text-white fill-white" />
                        </div>
                    </div>

                    {/* Price Impact Badge */}
                    <div className="absolute top-2 right-2">
                        {data.contentType === 'content_coin' ? (
                            <Badge className="bg-indigo-500 text-white border-0 font-bold text-xs">
                                {data.contentCoinSymbol} +{data.priceImpact}%
                            </Badge>
                        ) : (
                            <Badge className="bg-emerald-500 text-white border-0 font-bold text-xs">
                                +{data.priceImpact}%
                            </Badge>
                        )}
                    </div>

                    {/* Platform Badge */}
                    <div className="absolute top-2 left-2">
                        <Badge variant="secondary" className="bg-black/50 text-white backdrop-blur-sm border-0 text-[10px]">
                            {data.platform.toUpperCase()}
                        </Badge>
                    </div>
                </div>
            </Link>

            {/* Content */}
            <div className="p-4 flex-1 flex flex-col">
                {/* Creator Info - Links to Profile */}
                <Link href={profileUrl} className="flex items-center gap-2 mb-2 hover:opacity-80 transition-opacity">
                    <Avatar className="h-8 w-8 border border-border">
                        <AvatarImage src={data.streamerAvatar} />
                        <AvatarFallback>{data.streamerName[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{data.streamerName}</p>
                    </div>
                </Link>

                {/* Title - Links to Story Page */}
                <Link href={`/story/${data.id}`} className="block mb-2">
                    <h3 className="font-bold text-base leading-tight line-clamp-2 hover:text-primary transition-colors">
                        {data.title}
                    </h3>
                </Link>

                {/* Description (if available) */}
                {data.events && data.events.length > 0 && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3 flex-1">
                        {data.events[0].description || "Watch how this content moved the token price"}
                    </p>
                )}

                {/* Stats */}
                <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto">
                    <div className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        <span>{(data.viewCount / 1000).toFixed(1)}K views</span>
                    </div>
                    <div className="flex items-center gap-1 text-emerald-500 font-semibold">
                        <TrendingUp className="w-3 h-3" />
                        <span>+{data.priceImpact}%</span>
                    </div>
                </div>
            </div>
        </Card>
    );
}
