"use client";

import { Play, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

const MOCK_CLIPS = [
    {
        id: 1,
        title: "Raid on @Whale's Stream!",
        views: "1.2K",
        thumbnail: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&q=80&w=800",
        impact: "+12%",
        duration: "0:45"
    },
    {
        id: 2,
        title: "Calling the bottom (Perfect entry)",
        views: "850",
        thumbnail: "https://images.unsplash.com/photo-1642543492481-44e81e3914a7?auto=format&fit=crop&q=80&w=800",
        impact: "+5%",
        duration: "1:20"
    },
    {
        id: 3,
        title: "Donation Hype Train",
        views: "2.5K",
        thumbnail: "https://images.unsplash.com/photo-1518186285589-a4296f930545?auto=format&fit=crop&q=80&w=800",
        impact: "+8%",
        duration: "0:30"
    }
];

export function ClipsGrid() {
    return (
        <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Top Moments</h2>
                <span className="text-sm text-muted-foreground">From latest stream</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {MOCK_CLIPS.map((clip) => (
                    <Card key={clip.id} className="group cursor-pointer overflow-hidden border-0 shadow-md ring-1 ring-black/5 relative">
                        {/* Thumbnail */}
                        <div className="aspect-video relative">
                            <img
                                src={clip.thumbnail}
                                alt={clip.title}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />

                            {/* Play Button Overlay */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="bg-white/20 backdrop-blur-sm p-3 rounded-full">
                                    <Play className="w-6 h-6 text-white fill-white" />
                                </div>
                            </div>

                            {/* Duration Badge */}
                            <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                                {clip.duration}
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-3 bg-card">
                            <h3 className="font-semibold text-sm line-clamp-1 mb-2 group-hover:text-primary transition-colors">
                                {clip.title}
                            </h3>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Play className="w-3 h-3" /> {clip.views} views
                                </span>
                                <Badge variant="secondary" className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 border-0">
                                    <TrendingUp className="w-3 h-3 mr-1" />
                                    {clip.impact}
                                </Badge>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
