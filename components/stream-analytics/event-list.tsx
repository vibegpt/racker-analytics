"use client";

import { StreamEvent } from "@/lib/mock-data";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Zap, Gift, MessageCircle, Video } from "lucide-react";

interface EventListProps {
    events: StreamEvent[];
}

const getEventIcon = (type: StreamEvent['type']) => {
    switch (type) {
        case 'stream_start': return <Video className="h-4 w-4 text-blue-500" />;
        case 'raid': return <Zap className="h-4 w-4 text-yellow-500" />;
        case 'donation': return <Gift className="h-4 w-4 text-green-500" />;
        case 'stream_end': return <Video className="h-4 w-4 text-red-500" />;
        default: return <MessageCircle className="h-4 w-4 text-gray-500" />;
    }
};

const getEventColor = (type: StreamEvent['type']) => {
    switch (type) {
        case 'stream_start': return "bg-blue-500/10 text-blue-500 border-blue-200";
        case 'raid': return "bg-yellow-500/10 text-yellow-500 border-yellow-200";
        case 'donation': return "bg-green-500/10 text-green-500 border-green-200";
        case 'stream_end': return "bg-red-500/10 text-red-500 border-red-200";
        default: return "bg-gray-500/10 text-gray-500 border-gray-200";
    }
};

export function EventList({ events }: EventListProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((event) => (
                <Card key={event.id} className="hover:shadow-md transition-shadow border-border/50">
                    <CardContent className="p-4 flex items-start gap-4">
                        <div className={`p-2 rounded-full ${getEventColor(event.type)}`}>
                            {getEventIcon(event.type)}
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-sm">{event.label}</span>
                                <span className="text-xs text-muted-foreground">{format(new Date(event.timestamp), "h:mm a")}</span>
                            </div>
                            {event.value && (
                                <Badge variant="outline" className="font-mono text-xs">
                                    Value: {event.value}
                                </Badge>
                            )}
                            <p className="text-xs text-muted-foreground mt-1 capitalize">
                                {event.type.replace('_', ' ')}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
