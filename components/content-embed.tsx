"use client";

import { Platform } from "@prisma/client";

interface ContentEmbedProps {
  platform: Platform;
  contentId: string;
  embedUrl: string;
  className?: string;
}

export function ContentEmbed({ platform, contentId, embedUrl, className = "" }: ContentEmbedProps) {
  switch (platform) {
    case 'TWITTER':
      return (
        <iframe
          src={embedUrl}
          className={`w-full h-[300px] rounded-lg border-0 bg-transparent ${className}`}
          allowFullScreen
          loading="lazy"
        />
      );

    case 'YOUTUBE':
      return (
        <iframe
          src={embedUrl}
          className={`w-full aspect-video rounded-lg border-0 ${className}`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
        />
      );

    case 'INSTAGRAM':
      return (
        <iframe
          src={embedUrl}
          className={`w-full h-[450px] rounded-lg border-0 ${className}`}
          allowFullScreen
          loading="lazy"
        />
      );

    case 'TIKTOK':
      return (
        <iframe
          src={embedUrl}
          className={`w-full h-[600px] rounded-lg border-0 ${className}`}
          allowFullScreen
          loading="lazy"
        />
      );

    default:
      return (
        <div className={`w-full h-[200px] rounded-lg bg-[#1c2e28] flex items-center justify-center text-white/50 ${className}`}>
          <span className="text-sm">Preview not available for this platform</span>
        </div>
      );
  }
}

// Compact version for cards/grids
export function ContentEmbedCompact({ platform, contentId, embedUrl, className = "" }: ContentEmbedProps) {
  const maxHeight = platform === 'TIKTOK' ? 'max-h-[400px]' : 'max-h-[250px]';

  switch (platform) {
    case 'TWITTER':
      return (
        <div className={`overflow-hidden ${maxHeight} ${className}`}>
          <iframe
            src={embedUrl}
            className="w-full h-[300px] border-0 bg-transparent scale-90 origin-top"
            allowFullScreen
            loading="lazy"
          />
        </div>
      );

    case 'YOUTUBE':
      return (
        <iframe
          src={embedUrl}
          className={`w-full aspect-video border-0 ${className}`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
        />
      );

    case 'INSTAGRAM':
      return (
        <div className={`overflow-hidden ${maxHeight} ${className}`}>
          <iframe
            src={embedUrl}
            className="w-full h-[450px] border-0 scale-75 origin-top"
            allowFullScreen
            loading="lazy"
          />
        </div>
      );

    case 'TIKTOK':
      return (
        <div className={`overflow-hidden ${maxHeight} ${className}`}>
          <iframe
            src={embedUrl}
            className="w-full h-[600px] border-0 scale-[0.6] origin-top"
            allowFullScreen
            loading="lazy"
          />
        </div>
      );

    default:
      return (
        <div className={`w-full h-[150px] rounded-lg bg-[#1c2e28]/50 flex items-center justify-center text-white/40 ${className}`}>
          <span className="text-xs">No preview</span>
        </div>
      );
  }
}
