"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, TrendingUp, TrendingDown, Clock, Target } from "lucide-react";

interface Archetype {
    name: string;
    percentage: number;
    avgProfit: number;
    avgHoldTime: number;
    description: string;
}

interface AudienceDNAData {
    platform: string;
    totalWallets: number;
    avgHoldHours: number;
    diamondHandPct: number;
    repeatBuyerRate: number;
    profitTakersPct: number;
    archetypes: Archetype[];
    updatedAt: string;
}

export function AudienceDNA() {
    const [data, setData] = useState<AudienceDNAData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch('/api/insights/audience-dna')
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch audience DNA');
                return res.json();
            })
            .then(setData)
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">Loading audience DNA...</p>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="flex items-center justify-center py-12">
                <p className="text-destructive">Error: {error || 'No data available'}</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                            <Users className="h-4 w-4" />
                            <span>Total Wallets</span>
                        </div>
                        <div className="text-2xl font-bold">{data.totalWallets.toLocaleString()}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                            <Clock className="h-4 w-4" />
                            <span>Avg Hold Time</span>
                        </div>
                        <div className="text-2xl font-bold">{data.avgHoldHours.toFixed(1)}h</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                            <Target className="h-4 w-4" />
                            <span>Diamond Hands</span>
                        </div>
                        <div className="text-2xl font-bold text-emerald-500">{data.diamondHandPct}%</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                            <TrendingUp className="h-4 w-4" />
                            <span>Repeat Buyers</span>
                        </div>
                        <div className="text-2xl font-bold">{(data.repeatBuyerRate * 100).toFixed(1)}%</div>
                    </CardContent>
                </Card>
            </div>

            {/* Archetypes */}
            <div>
                <h3 className="text-xl font-bold mb-4">Wallet Behavior Archetypes</h3>
                <p className="text-muted-foreground mb-6">
                    Understanding the different types of holders in the Pump.fun ecosystem helps you tailor your content strategy.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data.archetypes.map((archetype, index) => {
                        const isProfit = archetype.avgProfit > 0;
                        const isProfitable = archetype.avgProfit >= 50;

                        return (
                            <Card key={index} className={`${isProfitable ? 'border-emerald-500/20 bg-emerald-500/5' : ''}`}>
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <CardTitle className="text-lg">{archetype.name}</CardTitle>
                                            <CardDescription className="mt-1">{archetype.description}</CardDescription>
                                        </div>
                                        <Badge variant={isProfit ? "default" : "destructive"} className="ml-2">
                                            {archetype.percentage}%
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <p className="text-muted-foreground mb-1">Avg Profit</p>
                                            <div className={`flex items-center gap-1 font-bold ${
                                                archetype.avgProfit > 0 ? 'text-emerald-500' : 'text-destructive'
                                            }`}>
                                                {archetype.avgProfit > 0 ? (
                                                    <TrendingUp className="h-4 w-4" />
                                                ) : (
                                                    <TrendingDown className="h-4 w-4" />
                                                )}
                                                {archetype.avgProfit > 0 ? '+' : ''}{archetype.avgProfit}%
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground mb-1">Hold Time</p>
                                            <div className="font-bold">{archetype.avgHoldTime}h</div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>

            {/* Insights */}
            <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                    <CardTitle>Key Insights</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <p className="text-sm">
                        • <strong>Diamond Hands ({data.diamondHandPct}%)</strong> - These holders rarely sell and are your most loyal audience
                    </p>
                    <p className="text-sm">
                        • <strong>Profit Takers ({data.profitTakersPct}%)</strong> - Nearly half your audience is actively taking profits
                    </p>
                    <p className="text-sm">
                        • <strong>Repeat Buyers ({(data.repeatBuyerRate * 100).toFixed(1)}%)</strong> - Building recurring audience is key to sustainable growth
                    </p>
                    <p className="text-sm text-muted-foreground mt-4">
                        Last updated: {new Date(data.updatedAt).toLocaleString()}
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
