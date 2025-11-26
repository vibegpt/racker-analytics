"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ShareDialog } from "@/components/share-dialog";
import { Share2, Users, TrendingUp } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, ReferenceLine, Tooltip } from "recharts";
import { StreamData } from "@/lib/mock-data";
import { motion } from "framer-motion";
import Link from "next/link";

interface StreamCardProps {
    data: StreamData;
}

export function StreamCard({ data }: StreamCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
        >
            <Link href={`/streams/${data.id}`}>
                <Card className="overflow-hidden border-border/50 bg-card shadow-sm hover:shadow-md transition-all duration-300 grid grid-cols-1 md:grid-cols-12 h-auto md:h-[320px] cursor-pointer">
                    {/* Left Side: Stream Visuals */}
                    <div className="md:col-span-5 relative group h-64 md:h-full">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10" />
                        <img
                            src={data.streamThumbnail}
                            alt={data.title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />

                        <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
                            <Badge variant="secondary" className="bg-white/90 text-black backdrop-blur-md font-bold shadow-sm">
                                {data.platform.toUpperCase()}
                            </Badge>
                            <Badge variant="destructive" className="animate-pulse shadow-sm">
                                LIVE
                            </Badge>
                        </div>

                        <div className="absolute bottom-4 left-4 right-4 z-20 text-white">
                            <h3 className="font-bold text-lg leading-tight mb-2 line-clamp-2">{data.title}</h3>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Avatar className="h-8 w-8 border-2 border-white">
                                        <AvatarImage src={data.streamerAvatar} />
                                        <AvatarFallback>{data.streamerName[0]}</AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm font-medium opacity-90">{data.streamerName}</span>
                                </div>
                                <div className="flex items-center gap-1 text-sm font-medium bg-black/40 px-2 py-1 rounded-full backdrop-blur-sm">
                                    <Users className="h-3 w-3" />
                                    {data.viewCount.toLocaleString()}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Analytics & Chart */}
                    <div className="md:col-span-7 p-6 flex flex-col justify-between bg-card">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-sm text-muted-foreground font-medium mb-1">Price Impact</p>
                                <div className="flex items-center gap-2">
                                    <span className="text-3xl font-bold text-foreground tracking-tight">
                                        +{data.priceImpact}%
                                    </span>
                                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200">
                                        <TrendingUp className="h-3 w-3 mr-1" />
                                        All Time High
                                    </Badge>
                                </div>
                            </div>
                            <ShareDialog
                                trigger={
                                    <Button variant="outline" size="icon" className="rounded-full hover:bg-secondary">
                                        <Share2 className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                }
                                title={`Share ${data.title}`}
                            />
                        </div>

                        <div className="h-[180px] w-full -ml-2">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={data.priceHistory}>
                                    <defs>
                                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="timestamp" hide />
                                    <YAxis domain={['auto', 'auto']} hide />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'var(--popover)',
                                            borderColor: 'var(--border)',
                                            borderRadius: '8px',
                                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                        }}
                                        itemStyle={{ color: 'var(--popover-foreground)' }}
                                        labelStyle={{ display: 'none' }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="price"
                                        stroke="var(--primary)"
                                        strokeWidth={3}
                                        dot={false}
                                        activeDot={{ r: 6, strokeWidth: 0 }}
                                        animationDuration={1500}
                                    />
                                    {data.events.map((event, index) => {
                                        // Simple collision avoidance logic: alternate levels
                                        const level = index % 3;
                                        const yOffset = level * 45; // Vertical spacing between cards

                                        return (
                                            <ReferenceLine
                                                key={event.id}
                                                x={event.timestamp}
                                                stroke="transparent" // Hide default line, we draw our own
                                                label={({ viewBox }) => {
                                                    const { x, y } = viewBox;
                                                    // Draw the line from the card down to the chart bottom
                                                    // We assume the chart height is roughly available or we draw long enough
                                                    const chartHeight = 180; // Approximate height from parent

                                                    return (
                                                        <g>
                                                            {/* Thin line connecting card to time */}
                                                            <line
                                                                x1={x}
                                                                y1={y + yOffset + 30}
                                                                x2={x}
                                                                y2={chartHeight}
                                                                stroke="var(--muted-foreground)"
                                                                strokeWidth={1}
                                                                strokeDasharray="3 3"
                                                                opacity={0.5}
                                                            />

                                                            {/* The Card */}
                                                            <foreignObject x={x - 60} y={y + yOffset} width={120} height={40} style={{ overflow: 'visible' }}>
                                                                <div className="flex items-center gap-2 px-2 py-1.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm rounded-md whitespace-nowrap transform transition-all hover:scale-105 hover:z-50 cursor-pointer">
                                                                    <div className={`h-2 w-2 rounded-full ${event.type === 'stream_start' ? 'bg-green-500' :
                                                                        event.type === 'raid' ? 'bg-purple-500' :
                                                                            event.type === 'donation' ? 'bg-yellow-500' : 'bg-blue-500'
                                                                        }`} />
                                                                    <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-200 truncate max-w-[80px]">
                                                                        {event.label}
                                                                    </span>
                                                                </div>
                                                            </foreignObject>
                                                        </g>
                                                    );
                                                }}
                                            />
                                        );
                                    })}
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="mt-4 pt-4 border-t border-border/50 flex justify-between items-center">
                            <p className="text-xs text-muted-foreground font-medium">
                                Correlated with {data.events.length} stream events
                            </p>
                            <Button size="sm" className="rounded-full font-semibold shadow-none">
                                View Analysis
                            </Button>
                        </div>
                    </div>
                </Card>
            </Link>
        </motion.div>
    );
}
