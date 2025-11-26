
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MOCK_SMART_LINKS, MOCK_LINK_CLICKS } from "@/lib/links/mock-data";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { MousePointerClick, DollarSign, ArrowUpRight } from "lucide-react";

export function LinkPerformanceCard() {
    // Aggregate data for the chart
    const platformStats = MOCK_SMART_LINKS.map(link => {
        const clicks = MOCK_LINK_CLICKS.filter(c => c.linkId === link.id);
        const revenue = clicks.reduce((sum, c) => sum + (c.conversionValue || 0), 0);
        return {
            name: link.platform,
            clicks: clicks.length,
            revenue: revenue,
            color: link.platform === 'twitter' ? '#0ea5e9' :
                link.platform === 'youtube' ? '#dc2626' :
                    link.platform === 'instagram' ? '#db2777' : '#64748b'
        };
    });

    const totalRevenue = platformStats.reduce((sum, p) => sum + p.revenue, 0);
    const totalClicks = platformStats.reduce((sum, p) => sum + p.clicks, 0);

    return (
        <Card className="col-span-1 md:col-span-2 lg:col-span-2 border-border/60">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-bold">Smart Link Performance</CardTitle>
                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                    ROI Active
                </Badge>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-4 bg-secondary/30 rounded-lg border border-border/50">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <MousePointerClick className="h-4 w-4" />
                            <span className="text-xs font-medium uppercase tracking-wider">Total Clicks</span>
                        </div>
                        <div className="text-2xl font-bold">{totalClicks.toLocaleString()}</div>
                    </div>
                    <div className="p-4 bg-secondary/30 rounded-lg border border-border/50">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <DollarSign className="h-4 w-4" />
                            <span className="text-xs font-medium uppercase tracking-wider">Attributed Rev</span>
                        </div>
                        <div className="text-2xl font-bold text-green-500">${totalRevenue.toLocaleString()}</div>
                    </div>
                </div>

                <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={platformStats} layout="vertical" margin={{ top: 0, right: 0, left: 40, bottom: 0 }}>
                            <XAxis type="number" hide />
                            <YAxis
                                dataKey="name"
                                type="category"
                                tick={{ fill: '#888888', fontSize: 12, textTransform: 'capitalize' }}
                                width={60}
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip
                                cursor={{ fill: 'transparent' }}
                                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px' }}
                                itemStyle={{ color: '#f8fafc' }}
                            />
                            <Bar dataKey="revenue" radius={[0, 4, 4, 0]} barSize={20}>
                                {platformStats.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="mt-4 text-xs text-center text-muted-foreground">
                    Revenue by Platform (Last 30 Days)
                </div>
            </CardContent>
        </Card>
    );
}
