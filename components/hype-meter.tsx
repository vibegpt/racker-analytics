
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Zap, Bot, Users, TrendingUp } from "lucide-react";
import { MOCK_CHAT_HISTORY } from "@/lib/sentiment/mock-data";
import { SentimentEngine } from "@/lib/sentiment/engine";
import { useMemo } from "react";

export function HypeMeter() {
    const stats = useMemo(() => {
        const engine = new SentimentEngine();
        // Process the last 30 minutes of chat
        const windowStart = new Date(Date.now() - 30 * 60 * 1000);
        return engine.processWindow(MOCK_CHAT_HISTORY, windowStart, 30);
    }, []);

    return (
        <Card className="border-border/60">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                    Live Hype Meter
                </CardTitle>
                <Badge variant={stats.hypeScore > 50 ? "default" : "secondary"}>
                    {stats.hypeScore > 80 ? "🔥 ON FIRE" : stats.hypeScore > 50 ? "⚡ ACTIVE" : "💤 QUIET"}
                </Badge>
            </CardHeader>
            <CardContent>
                <div className="flex items-end gap-2 mb-4">
                    <span className="text-4xl font-bold">{Math.round(stats.hypeScore)}</span>
                    <span className="text-sm text-muted-foreground mb-1">/ 100</span>
                </div>

                <div className="space-y-4">
                    <div>
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Sentiment</span>
                            <span className={stats.averageSentiment > 0 ? "text-green-500" : "text-red-500"}>
                                {stats.averageSentiment > 0 ? "Positive" : "Negative"}
                            </span>
                        </div>
                        <Progress value={(stats.averageSentiment + 1) * 50} className="h-2" />
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2">
                        <div className="bg-secondary/30 p-2 rounded border border-border/50 flex items-center gap-2">
                            <Users className="h-4 w-4 text-blue-500" />
                            <div>
                                <div className="text-xs text-muted-foreground">Real Fans</div>
                                <div className="font-bold">{stats.genuineCount}</div>
                            </div>
                        </div>
                        <div className="bg-secondary/30 p-2 rounded border border-border/50 flex items-center gap-2">
                            <Bot className="h-4 w-4 text-orange-500" />
                            <div>
                                <div className="text-xs text-muted-foreground">Bots Blocked</div>
                                <div className="font-bold text-orange-500">{stats.botCount}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
