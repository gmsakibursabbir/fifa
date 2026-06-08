"use client";

import { useState } from "react";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { CHANNEL_CATEGORIES } from "@/types/channel";
import ChannelCard from "./ChannelCard";
import { ChannelCardSkeleton } from "@/components/common/LoadingSkeleton";
import type { Channel } from "@/types/channel";

interface ChannelSidebarProps {
  channels: Channel[];
  filtered: Channel[];
  isLoading: boolean;
  search: string;
  setSearch: (v: string) => void;
  category: string;
  setCategory: (v: string) => void;
  favorites: Set<number>;
  onFavoriteToggle: (id: number) => void;
  activeId?: number;
}

export default function ChannelSidebar({
  filtered,
  isLoading,
  search,
  setSearch,
  category,
  setCategory,
  favorites,
  onFavoriteToggle,
  activeId,
}: ChannelSidebarProps) {
  const [showFilters, setShowFilters] = useState(false);

  const categories = ["All", ...CHANNEL_CATEGORIES];

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            id="channel-search"
            type="text"
            placeholder="Search channels…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-cyan-500/50 focus:bg-white/8 transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            "flex items-center gap-2 text-xs font-medium transition-colors",
            showFilters ? "text-cyan-400" : "text-gray-500 hover:text-gray-300"
          )}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Categories
        </button>

        {/* Category filters */}
        {showFilters && (
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                id={`cat-filter-${cat.toLowerCase()}`}
                onClick={() => setCategory(cat)}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-medium transition-all",
                  category === cat
                    ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                    : "bg-white/5 text-gray-500 hover:text-gray-300 border border-transparent"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Channel list */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2 scrollbar-thin">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => <ChannelCardSkeleton key={i} />)
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            No channels found
          </div>
        ) : (
          filtered.map((channel, i) => (
            <ChannelCard
              key={channel.id}
              channel={channel}
              isFavorite={favorites.has(channel.id)}
              onFavoriteToggle={onFavoriteToggle}
              isActive={activeId === channel.id}
              compact
              index={i}
            />
          ))
        )}
      </div>
    </div>
  );
}
