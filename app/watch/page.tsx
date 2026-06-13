"use client";

import { useParams, useRouter } from "next/navigation";
import { useMemo } from "react";
import { Tv, Heart, Clock, Search } from "lucide-react";
import HLSPlayer from "@/components/player/HLSPlayer";
import { useChannels } from "@/hooks/useChannels";
import { useFavorites } from "@/hooks/useFavorites";
import { useRecentlyWatched } from "@/hooks/useRecentlyWatched";
import LivePulseBadge from "@/components/common/LivePulseBadge";
import ChannelCard from "@/components/channels/ChannelCard";
import { CHANNEL_CATEGORIES } from "@/types/channel";

export default function WatchPage() {
  const params = useParams<{ id?: string }>();
  const router = useRouter();
  const channelId = params?.id ? parseInt(params.id) : null;

  const { channels, filtered, isLoading, search, setSearch, category, setCategory } = useChannels();
  const { favorites, toggle, isFavorite } = useFavorites();
  const { recentIds, addRecent } = useRecentlyWatched();

  const activeChannel = useMemo(
    () => channels.find((c) => c.id === channelId) || channels[0] || null,
    [channels, channelId]
  );

  const recentChannels = useMemo(
    () => recentIds.map((id) => channels.find((c) => c.id === id)).filter(Boolean),
    [channels, recentIds]
  );

  const handlePlay = (id: number) => {
    addRecent(id);
    router.push(`/watch/${id}`);
  };

  return (
    <div className="max-w-[1600px] mx-auto px-8 md:px-16 pt-16 pb-32 min-h-screen bg-black">
      {/* 2-Column YouTube-Style Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Side: Video Player & Metadata Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="relative w-full aspect-video rounded-lg md:rounded-xl overflow-hidden bg-[#0d0d11] border border-white/5 shadow-2xl shadow-black/95 flex items-center justify-center">
            {/* Grid overlay for video deck */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-size-[32px_32px] pointer-events-none -z-10" />

            {activeChannel ? (
              <div className="w-full h-full">
                <HLSPlayer
                  key={activeChannel.id}
                  src={activeChannel.stream}
                  channelName={activeChannel.name}
                  autoPlay
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="text-center p-8">
                <Tv className="w-16 h-16 text-white/20 mx-auto mb-4" />
                <h3 className="text-white font-bold text-lg mb-1">Select a Channel</h3>
                <p className="text-white/40 text-sm">Choose from the available channels list to start streaming</p>
              </div>
            )}
          </div>

          {/* Active Channel Info Card */}
          {activeChannel ? (
            <div className="bg-white/1 border border-white/5 rounded-xl md:rounded-2xl p-6 md:p-8 shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
                <div className="flex items-center gap-4">
                  <div className="shrink-0 w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-inner">
                    {activeChannel.logo ? (
                      <img
                        src={activeChannel.logo}
                        alt={activeChannel.name}
                        className="w-10 h-10 object-contain"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    ) : (
                      <Tv className="w-6 h-6 text-white/40" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <h2 className="text-white font-extrabold text-xl md:text-2xl tracking-tight leading-none">{activeChannel.name}</h2>
                      {activeChannel.isLive && <LivePulseBadge size="sm" />}
                    </div>
                    <p className="text-white/40 text-xs font-bold uppercase tracking-widest">
                      {activeChannel.category} · <span className="text-cyan-400">{activeChannel.quality}</span>
                    </p>
                  </div>
                </div>

                <button
                  id={`watch-fav-btn-${activeChannel.id}`}
                  onClick={() => toggle(activeChannel.id)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                    isFavorite(activeChannel.id)
                      ? "bg-red-500/20 text-red-400 border border-red-500/20 shadow-lg"
                      : "bg-white/5 border border-white/5 text-white/60 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isFavorite(activeChannel.id) ? "fill-current" : ""}`} />
                  {isFavorite(activeChannel.id) ? "Saved to Favourites" : "Add to Favourites"}
                </button>
              </div>

              {/* Description & Additional Info */}
              <div className="space-y-4">
                <h3 className="text-white font-bold text-sm uppercase tracking-wider">About this channel</h3>
                <p className="text-white/60 text-sm leading-relaxed max-w-2xl">
                  {activeChannel.description || 
                    `Watch live sports, high-definition action and real-time coverage on ${activeChannel.name}. Streaming live continuously with free access.`}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4">
                  {[
                    { label: "Language", value: activeChannel.language || "Multilingual" },
                    { label: "Country", value: activeChannel.country || "Global" },
                    { label: "Quality Profile", value: activeChannel.quality || "HD" },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-white/1 border border-white/3 rounded-2xl p-4">
                      <span className="text-white/30 text-[10px] font-bold uppercase tracking-widest block mb-1">{label}</span>
                      <span className="text-white font-bold text-sm">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white/1 border border-white/5 rounded-3xl p-8 text-center text-white/30">
              Select a channel to view channel details.
            </div>
          )}
        </div>

        {/* Right Side: Scrollable Channel List & Navigation */}
        <div className="space-y-6 lg:h-[calc(100vh-200px)] lg:overflow-y-auto hide-scrollbar pr-1 lg:sticky lg:top-28">
          {/* Section Header */}
          <div className="px-1">
            <h3 className="text-white font-extrabold text-lg uppercase tracking-wider">Live Channels</h3>
            <p className="text-white/40 text-xs mt-1">Browse and switch between matches</p>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-3.5 w-4 h-4 text-white/30" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search live streams..."
              className="w-full pl-11 pr-4 py-3 rounded-full bg-white/5 border border-white/5 text-white text-xs font-semibold tracking-wide placeholder:text-white/25 focus:outline-none focus:bg-white/10 focus:border-white/10 transition-all shadow-inner"
            />
          </div>

          {/* Category Selector Pills */}
          <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
            {["All", ...CHANNEL_CATEGORIES].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap border ${
                  category === cat
                    ? "bg-white text-black border-white"
                    : "bg-white/5 border-white/5 text-white/60 hover:text-white hover:bg-white/10"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Favourites (if any exist) */}
          {favorites.size > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <Heart className="w-3.5 h-3.5 text-red-400" />
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Saved Favourites</span>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {channels
                  .filter((c) => favorites.has(c.id))
                  .map((ch) => (
                    <ChannelCard
                      key={ch.id}
                      channel={ch}
                      isFavorite
                      onFavoriteToggle={toggle}
                      isActive={activeChannel?.id === ch.id}
                      compact
                      onClick={() => addRecent(ch.id)}
                    />
                  ))}
              </div>
            </div>
          )}

          {/* Recently Watched (if any exist) */}
          {recentChannels.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <Clock className="w-3.5 h-3.5 text-white/40" />
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Recently Watched</span>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {recentChannels.slice(0, 3).map((ch) => ch && (
                  <ChannelCard
                    key={ch.id}
                    channel={ch}
                    isFavorite={favorites.has(ch.id)}
                    onFavoriteToggle={toggle}
                    isActive={activeChannel?.id === ch.id}
                    compact
                    onClick={() => addRecent(ch.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* All Channels List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1 border-t border-white/5 pt-4">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                {category} Channels ({filtered.length})
              </span>
            </div>
            
            {filtered.length === 0 ? (
              <div className="bg-white/1 border border-white/5 rounded-2xl p-8 text-center text-white/30 text-xs font-semibold">
                No matching channels found
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {filtered.map((ch) => (
                  <ChannelCard
                    key={ch.id}
                    channel={ch}
                    isFavorite={favorites.has(ch.id)}
                    onFavoriteToggle={toggle}
                    isActive={activeChannel?.id === ch.id}
                    compact
                    onClick={() => addRecent(ch.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
