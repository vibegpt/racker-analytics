"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Share2, Download, Twitter, Instagram } from "lucide-react";
import { useState } from "react";

interface ShareDialogProps {
    trigger?: React.ReactNode;
    title?: string;
    image?: string;
}

export function ShareDialog({ trigger, title = "Share Snapshot", image }: ShareDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    const handleShare = (platform: string) => {
        setIsGenerating(true);
        // Simulate generation delay
        setTimeout(() => {
            setIsGenerating(false);
            setIsOpen(false);
            console.log(`Shared to ${platform}`);
        }, 1000);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" size="icon" className="rounded-full">
                        <Share2 className="h-4 w-4" />
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>
                        Share this moment with your community.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex items-center justify-center py-6">
                    <div className="relative aspect-video w-full bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 shadow-2xl">
                        {/* Mock Generated Image Preview */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-4 bg-gradient-to-br from-indigo-900 to-black">
                            <h3 className="font-bold text-xl mb-2">All Time High! 🚀</h3>
                            <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                                +45.2%
                            </p>
                            <p className="text-sm opacity-60 mt-2">@CryptoKing on Pump.fun</p>
                        </div>
                    </div>
                </div>

                <DialogFooter className="sm:justify-center gap-2">
                    <Button
                        variant="outline"
                        className="gap-2"
                        onClick={() => handleShare('twitter')}
                        disabled={isGenerating}
                    >
                        <Twitter className="h-4 w-4 text-blue-400" />
                        Tweet
                    </Button>
                    <Button
                        variant="outline"
                        className="gap-2"
                        onClick={() => handleShare('instagram')}
                        disabled={isGenerating}
                    >
                        <Instagram className="h-4 w-4 text-pink-500" />
                        Story
                    </Button>
                    <Button
                        className="gap-2"
                        onClick={() => handleShare('download')}
                        disabled={isGenerating}
                    >
                        <Download className="h-4 w-4" />
                        {isGenerating ? "Generating..." : "Download"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
