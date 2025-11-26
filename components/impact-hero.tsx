"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, TrendingUp, TrendingDown, Zap } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceDot } from "recharts";
import { StreamData } from "@/lib/mock-data";

interface ImpactHeroProps {
    stream: StreamData;
}

export function ImpactHero({ stream }: ImpactHeroProps) {
    const isPositive = stream.priceImpact >= 0;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Stream Thumbnail Section */}
            <Card className="lg:col-span-1 overflow-hidden border-0 shadow-xl ring-1 ring-black/5 group cursor-pointer relative h-[300px] lg:h-auto">
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors z-10" />
                <img
                    src={stream.streamThumbnail}
                    alt={stream.title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />

                <div className="absolute inset-0 z-20 flex flex-col justify-between p-6">
                    <div className="flex justify-between items-start">
                        <Badge className="bg-red-500 hover:bg-red-600 text-white border-0 animate-pulse">
                            LIVE REPLAY
                        </Badge>
                        <div className="bg-black/50 backdrop-blur-md text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
                            <Zap className="w-4 h-4 text-yellow-400" />
                            {stream.platform.toUpperCase()}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-white font-bold text-xl leading-tight mb-2 drop-shadow-md line-clamp-2">
                            {stream.title}
                        </h3>
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full border-2 border-white overflow-hidden">
                                <img src={stream.streamerAvatar} alt={stream.streamerName} />
                            </div>
                            <span className="text-white font-medium drop-shadow-md">{stream.streamerName}</span>
                        </div>
                    </div>

                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="bg-white/20 backdrop-blur-md p-4 rounded-full">
                            <Play className="w-8 h-8 text-white fill-white" />
                        </div>
                    </div>
                </div>
            </Card>

            {/* Price Chart Section */}
            <Card className="lg:col-span-2 border-0 shadow-lg ring-1 ring-black/5 bg-white/50 backdrop-blur-sm">
                <CardContent className="p-6 h-full flex flex-col">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-lg font-semibold text-muted-foreground uppercase tracking-wider text-xs">Session Impact</h2>
                            <div className="flex items-baseline gap-3 mt-1">
                                <span className="text-3xl font-bold text-foreground">
                                    {isPositive ? "+" : ""}{stream.priceImpact}%
                                </span>
                                <span className={`flex items-center text-sm font-medium ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
                                    {isPositive ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                                    during stream
                                </span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            {stream.events.map((event) => (
                                <div key={event.id} className="flex items-center gap-1 text-xs bg-secondary px-2 py-1 rounded-md border border-border/50">
                                    <div className={`w-2 h-2 rounded-full ${event.type === 'donation' ? 'bg-yellow-400' :
                                            event.type === 'raid' ? 'bg-purple-500' : 'bg-blue-500'
                                        }`} />
                                    {event.label}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 min-h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stream.priceHistory}>
                                <defs>
                                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis
                                    dataKey="timestamp"
                                    hide
                                />
                                <YAxis
                                    domain={['auto', 'auto']}
                                    hide
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'var(--background)',
                                        borderColor: 'var(--border)',
                                        borderRadius: 'var(--radius)',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                    }}
                                    itemStyle={{ color: 'var(--foreground)' }}
                                    labelFormatter={() => ''}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="price"
                                    stroke="var(--primary)"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorPrice)"
                                />
                                {/* Add dots for events - simplified logic for demo */}
                                {stream.events.map((event, index) => {
                                    // Find closest price point to event timestamp
                                    // For demo, we just pick a point
                                    const dataPoint = stream.priceHistory[Math.floor(stream.priceHistory.length * ((index + 1) / (stream.events.length + 1)))];
                                    if (!dataPoint) return null;

                                    return (
                                        <ReferenceDot
                                            key={event.id}
                                            x={dataPoint.timestamp}
                                            y={dataPoint.price}
                                            r={6}
                                            fill="var(--background)"
                                            stroke="var(--primary)"
                                            strokeWidth={2}
                                        />
                                    );
                                })}
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
