"use client";

import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, ReferenceLine, ReferenceDot } from "recharts";
import { StreamData, StreamEvent } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface EventChartProps {
    data: StreamData;
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-popover border border-border p-3 rounded-lg shadow-lg">
                <p className="text-sm font-medium text-popover-foreground">
                    {format(new Date(label), "h:mm:ss a")}
                </p>
                <p className="text-sm font-bold text-primary">
                    ${payload[0].value.toFixed(2)}
                </p>
            </div>
        );
    }
    return null;
};

export function EventChart({ data }: EventChartProps) {
    // Calculate domain for Y-axis to make the chart look good
    const prices = data.priceHistory.map(p => p.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const padding = (maxPrice - minPrice) * 0.1;

    return (
        <Card className="w-full h-[400px] md:h-[500px]">
            <CardHeader>
                <CardTitle>Price Correlation Analysis</CardTitle>
            </CardHeader>
            <CardContent className="h-[320px] md:h-[420px]">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.priceHistory}>
                        <defs>
                            <linearGradient id="colorPriceDetail" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <XAxis
                            dataKey="timestamp"
                            tickFormatter={(time) => format(new Date(time), "h:mm a")}
                            stroke="var(--muted-foreground)"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            domain={[minPrice - padding, maxPrice + padding]}
                            stroke="var(--muted-foreground)"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `$${value.toFixed(2)}`}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Line
                            type="monotone"
                            dataKey="price"
                            stroke="var(--primary)"
                            strokeWidth={3}
                            dot={false}
                            activeDot={{ r: 8 }}
                        />
                        {data.events.map((event) => {
                            // Find the price at this timestamp for the dot
                            const pricePoint = data.priceHistory.find(p => Math.abs(p.timestamp - event.timestamp) < 60000); // Approx match
                            const price = pricePoint ? pricePoint.price : 0;

                            return (
                                <ReferenceDot
                                    key={event.id}
                                    x={event.timestamp}
                                    y={price}
                                    r={6}
                                    fill="var(--background)"
                                    stroke="var(--destructive)"
                                    strokeWidth={2}
                                    isFront={true}
                                />
                            );
                        })}
                        {data.events.map((event) => (
                            <ReferenceLine
                                key={`line-${event.id}`}
                                x={event.timestamp}
                                stroke="var(--destructive)"
                                strokeDasharray="3 3"
                                strokeOpacity={0.5}
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
