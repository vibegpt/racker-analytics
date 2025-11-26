"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Share2, TrendingUp, Play } from "lucide-react";
import { StreamData } from "@/lib/mock-data";
import { motion } from "framer-motion";
import Link from "next/link";

interface ImpactCardProps {
    data: StreamData;
}

export function ImpactCard({ data }: ImpactCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md mx-auto mb-8"
        >
            <Link href={`/story/${data.id}`}>
                <Card className="overflow-hidden border-0 shadow-xl bg-black relative aspect-[9/16] rounded-3xl cursor-pointer group">
                    {/* Video Background Placeholder */}
                    <div className="absolute inset-0">
                        <img
                            src={data.streamThumbnail}
                            alt={data.title}
                            className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/80" />
                    </div>

                    {/* Top Overlay */}
                    <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-20">
                        <div className="flex items-center gap-2">
                            <Avatar className="h-10 w-10 border-2 border-white shadow-md">
                                <AvatarImage src={data.streamerAvatar} />
                                <AvatarFallback>{data.streamerName[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="text-white font-bold text-sm shadow-black drop-shadow-md">{data.streamerName}</p>
                                <Badge variant="secondary" className="bg-white/20 text-white backdrop-blur-md border-0 text-[10px] px-1.5 h-5">
                                    {data.platform.toUpperCase()}
                                </Badge>
                            </div>
                        </div>
                        {data.contentType === 'content_coin' ? (
                            <Badge className="bg-indigo-500 text-white border-0 font-bold flex items-center gap-1">
                                <span className="opacity-80 text-[10px] mr-1">COIN</span>
                                {data.contentCoinSymbol}
                                <span className="ml-1 text-emerald-200">+{data.priceImpact}%</span>
                            </Badge>
                        ) : (
                            <Badge className="bg-emerald-500 text-white border-0 font-bold animate-pulse">
                                +{data.priceImpact}%
                            </Badge>
                        )}
                    </div>

                    {/* Center Play Button (Hover) */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                        <div className="bg-white/20 backdrop-blur-md p-4 rounded-full">
                            <Play className="w-12 h-12 text-white fill-white" />
                        </div>
                    </div>

                    {/* Bottom Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 z-20 text-white">
                        <h3 className="font-bold text-xl leading-tight mb-3 line-clamp-2 drop-shadow-md">
                            {data.title}
                        </h3>

                        {/* Mini Chart Placeholder */}
                        <div className="h-16 w-full bg-white/10 backdrop-blur-sm rounded-xl mb-4 p-2 flex items-end gap-1">
                            {data.priceHistory.slice(-20).map((p, i) => (
                                <div
                                    key={i}
                                    className="flex-1 bg-emerald-400/80 rounded-t-sm"
                                    style={{ height: `${(p.price / 20) * 100}%` }}
                                />
                            ))}
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex gap-4">
                                <Button size="icon" variant="ghost" className="text-white hover:bg-white/20 rounded-full">
                                    <Heart className="w-6 h-6" />
                                </Button>
                                <Button size="icon" variant="ghost" className="text-white hover:bg-white/20 rounded-full">
                                    <MessageCircle className="w-6 h-6" />
                                </Button>
                            </div>
                            <Button size="icon" variant="ghost" className="text-white hover:bg-white/20 rounded-full">
                                <Share2 className="w-6 h-6" />
                            </Button>
                        </div>
                    </div>
                </Card>
            </Link>
        </motion.div>
    );
}
