"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Heart, Play, Tv } from "lucide-react";
import type { Channel } from "@/types/channel";
import LivePulseBadge from "@/components/common/LivePulseBadge";
import { cn } from "@/lib/utils";
import { playClickSound, playHoverSound } from "@/lib/audio";

interface ChannelCardProps {
  channel: Channel;
  isFavorite?: boolean;
  onFavoriteToggle?: (id: number) => void;
  isActive?: boolean;
  compact?: boolean;
  index?: number;
  onClick?: () => void;
}

const QUALITY_COLORS: Record<string, string> = {
  "4K": "text-[#fcee0a] bg-[#fcee0a]/10 border-[#fcee0a]/35",
  FHD:  "text-[#39ff14] bg-[#39ff14]/10 border-[#39ff14]/35",
  HD:   "text-[#00f0ff] bg-[#00f0ff]/10 border-[#00f0ff]/35",
  SD:   "text-white/40 bg-white/5 border-white/15",
};

export default function ChannelCard({
  channel,
  isFavorite,
  onFavoriteToggle,
  isActive,
  compact = false,
  index = 0,
  onClick,
}: ChannelCardProps) {
  const handleClick = () => {
    playClickSound();
    if (onClick) onClick();
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04, ease: [0.25, 0.8, 0.25, 1] }}
    >
      <Link
        href={`/watch/${channel.id}`}
        id={`channel-card-${channel.id}`}
        onClick={handleClick}
        onMouseEnter={() => playHoverSound()}
        aria-label={`Watch ${channel.name}${channel.isLive ? " — Live" : ""}`}
      >
        <div
          className={cn(
            "relative flex items-center gap-4 p-4 border bg-[#09090d]",
            "border-[#00f0ff]/18 transition-all duration-300 ease-out group overflow-hidden",
            "hover:border-[#fcee0a]/60 hover:bg-[#fcee0a]/[0.03]",
            "hover:shadow-[0_0_20px_rgba(252,238,10,0.08)]",
            "hover:translate-x-[2px]",
            "active:scale-[0.99]",
            isActive && "border-[#00f0ff]/60 bg-[#00f0ff]/5 shadow-[0_0_20px_rgba(0,240,255,0.12)]"
          )}
        >
          {/* Top-left corner accent */}
          <div className="absolute top-0 left-0 w-2 h-2 bg-[#fcee0a]" aria-hidden="true" />
          {/* Bottom-right accent */}
          <div className="absolute bottom-0 right-0 w-4 h-[2px] bg-[#ff0055]" aria-hidden="true" />
          {/* Active glow line at top */}
          {isActive && (
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#00f0ff] via-[#fcee0a] to-[#00f0ff] animate-live-pulse" aria-hidden="true" />
          )}

          {/* Logo container */}
          <div className="relative shrink-0 w-12 h-12 overflow-hidden bg-white/5 border border-white/10 transition-transform duration-300 group-hover:scale-105">
            {channel.logo ? (
              <img
                src={channel.logo}
                alt={channel.name}
                className="w-full h-full object-contain p-1.5"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Tv className="w-5 h-5 text-white/30" aria-hidden="true" />
              </div>
            )}
            {/* Play overlay on hover */}
            <div
              className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              aria-hidden="true"
            >
              <Play className="w-5 h-5 text-[#fcee0a] fill-[#fcee0a]" />
            </div>
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-white font-bold text-sm truncate transition-colors duration-300 group-hover:text-[#fcee0a] font-cyber">
                {channel.name}
              </span>
              {channel.isLive && <LivePulseBadge size="sm" />}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-white/35 text-[9px] font-mono font-bold uppercase tracking-wider">
                {channel.category}
              </span>
              {channel.quality && (
                <span
                  className={cn(
                    "text-[8px] font-cyber font-extrabold px-1.5 py-[1px] border leading-none tracking-wider",
                    QUALITY_COLORS[channel.quality] || QUALITY_COLORS.SD
                  )}
                >
                  {channel.quality}
                </span>
              )}
            </div>
          </div>

          {/* Right section */}
          {isActive ? (
            <div className="shrink-0 flex items-end gap-[3px] h-5 px-1" aria-label="Playing stream">
              <div className="eq-bar eq-bar-1" />
              <div className="eq-bar eq-bar-2" />
              <div className="eq-bar eq-bar-3" />
            </div>
          ) : (
            onFavoriteToggle && (
              <button
                id={`fav-btn-${channel.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  playClickSound();
                  onFavoriteToggle(channel.id);
                }}
                aria-label={isFavorite ? `Remove ${channel.name} from favorites` : `Add ${channel.name} to favorites`}
                aria-pressed={isFavorite}
                className={cn(
                  "shrink-0 p-2 transition-all duration-300 hover:scale-110 border border-transparent",
                  isFavorite
                    ? "text-[#ff0055] bg-[#ff0055]/10 border-[#ff0055]/20"
                    : "text-white/20 hover:text-[#ff0055] hover:bg-[#ff0055]/10 hover:border-[#ff0055]/20"
                )}
              >
                <Heart className={cn("w-4 h-4", isFavorite && "fill-current")} />
              </button>
            )
          )}
        </div>
      </Link>
    </motion.div>
  );
}
