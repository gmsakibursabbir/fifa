"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Heart, Play, Tv } from "lucide-react";
import type { Channel } from "@/types/channel";
import LivePulseBadge from "@/components/common/LivePulseBadge";
import { cn } from "@/lib/utils";

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
  "4K":  "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  FHD:   "text-green-400 bg-green-400/10 border-green-400/20",
  HD:    "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",
  SD:    "text-gray-400 bg-gray-400/10 border-gray-400/20",
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
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
    >
      <Link href={`/watch/${channel.id}`} id={`channel-card-${channel.id}`} onClick={onClick}>
        <div
          className={cn(
            "relative flex items-center gap-4 p-4 rounded-2xl border bg-white/[0.02] border-white/5 transition-all duration-300 ease-out hover:bg-white/[0.06] hover:border-white/15 hover:translate-x-1 active:scale-[0.99] group",
            isActive && "border-cyan-500/40 bg-cyan-500/5 shadow-[0_0_15px_-3px_rgba(6,182,212,0.15)]"
          )}
        >
          {/* Logo container */}
          <div className="relative flex-shrink-0 w-12 h-12 rounded-xl overflow-hidden bg-white/5 border border-white/10 transition-transform duration-300 group-hover:scale-105">
            {channel.logo ? (
              <img
                src={channel.logo}
                alt={channel.name}
                className="w-full h-full object-contain p-2"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Tv className="w-5 h-5 text-white/30" />
              </div>
            )}
            {/* Play overlay on hover */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Play className="w-4 h-4 text-white fill-white" />
            </div>
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-white font-bold text-sm truncate transition-colors duration-300 group-hover:text-cyan-400">{channel.name}</span>
              {channel.isLive && <LivePulseBadge size="sm" />}
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-white/40 text-[10px] font-bold uppercase tracking-wider">{channel.category}</span>
              {channel.quality && (
                <span
                  className={cn(
                    "text-[8px] font-extrabold px-1 rounded border leading-none tracking-wider",
                    QUALITY_COLORS[channel.quality] || QUALITY_COLORS.SD
                  )}
                >
                  {channel.quality}
                </span>
              )}
            </div>
          </div>

          {/* Right Section: Equalizer Wave or Favorite Icon */}
          {isActive ? (
            <div className="flex-shrink-0 flex items-end gap-0.5 h-4 px-2" aria-label="Playing stream">
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
                  onFavoriteToggle(channel.id);
                }}
                className={cn(
                  "flex-shrink-0 p-2 rounded-xl transition-all duration-300 hover:scale-110",
                  isFavorite
                    ? "text-red-400 bg-red-400/10"
                    : "text-white/20 hover:text-red-400 hover:bg-red-400/10"
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
