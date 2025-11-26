"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ArrowUpRight, MessageCircle, Heart, Repeat, Share2 } from "lucide-react";

interface PlatformCardProps {
    platform: 'twitter' | 'instagram' | 'youtube' | 'pump';
    handle: string;
    stats: {
        posts: number;
        engagement: string;
        impact: number;
    };
}

const PLATFORM_CONFIG = {
    twitter: {
        color: 'bg-sky-500',
        icon: <MessageCircle className="w-5 h-5 text-white" />,
        label: 'Twitter / X'
    },
    instagram: {
        color: 'bg-pink-600',
        icon: <Heart className="w-5 h-5 text-white" />,
        label: 'Instagram'
    },
    youtube: {
        color: 'bg-red-600',
        icon: <Share2 className="w-5 h-5 text-white" />,
        label: 'YouTube'
    },
    pump: {
        color: 'bg-emerald-500',
        icon: <Repeat className="w-5 h-5 text-white" />,
        label: 'Pump.fun'
    }
};

export function PlatformCard({ platform, handle, stats }: PlatformCardProps) {
    const config = PLATFORM_CONFIG[platform];

    return (
        <Card className="group hover:shadow-lg transition-all duration-300 border-border/50 overflow-hidden">
            <CardContent className="p-0">
                <div className="p-4 flex items-center justify-between border-b border-border/50 bg-secondary/30">
                    <div className="flex items-center gap-3">
                        <div className={`${config.color} p-2 rounded-lg shadow-sm group-hover:scale-110 transition-transform`}>
                            {config.icon}
                        </div>
                        <div>
                            <h4 className="font-semibold text-sm">{config.label}</h4>
                            <p className="text-xs text-muted-foreground">@{handle}</p>
                        </div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>

                <div className="p-4 grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-xs text-muted-foreground mb-1">Content</p>
                        <p className="font-bold text-lg">{stats.posts} <span className="text-xs font-normal text-muted-foreground">posts</span></p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground mb-1">Impact</p>
                        <p className="font-bold text-lg text-emerald-500">+{stats.impact}%</p>
                    </div>
                    <div className="col-span-2 pt-2 border-t border-border/50">
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-muted-foreground">Engagement Score</span>
                            <span className="font-bold text-sm">{stats.engagement}</span>
                        </div>
                        <div className="h-1.5 w-full bg-secondary rounded-full mt-2 overflow-hidden">
                            <div
                                className={`h-full ${config.color} opacity-80`}
                                style={{ width: '75%' }}
                            />
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
