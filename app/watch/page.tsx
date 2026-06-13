"use client";

import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Tv, Heart, Clock, Search, Globe, Languages, Signal, Radio } from "lucide-react";
import HLSPlayer, { type StreamChannel } from "@/components/player/HLSPlayer";
import { useChannels } from "@/hooks/useChannels";
import { useFavorites } from "@/hooks/useFavorites";
import { useRecentlyWatched } from "@/hooks/useRecentlyWatched";
import LivePulseBadge from "@/components/common/LivePulseBadge";
import { CHANNEL_CATEGORIES } from "@/types/channel";
import type { Channel } from "@/types/channel";
import { cn } from "@/lib/utils";

/* Convert Channel → StreamChannel for the in-player Stream picker */
function toStreamChannel(ch: Channel): StreamChannel {
  return {
    id: ch.id,
    name: ch.name,
    logo: ch.logo || `/api/logo?name=${encodeURIComponent(ch.name)}`,
    category: ch.category,
    quality: ch.quality,
    isLive: ch.isLive,
    src: `/api/stream/${ch.id}/playlist.m3u8`,
  };
}

export default function WatchPage() {
  const params    = useParams<{ id?: string }>();
  const router    = useRouter();
  const channelId = params?.id ? parseInt(params.id) : null;

  const { channels, filtered, isLoading, search, setSearch, category, setCategory } = useChannels();
  const { favorites, toggle, isFavorite } = useFavorites();
  const { recentIds, addRecent }           = useRecentlyWatched();

  const activeChannel = useMemo(
    () => channels.find((c) => c.id === channelId) || channels[0] || null,
    [channels, channelId]
  );

  const recentChannels = useMemo(
    () => recentIds.map((id) => channels.find((c) => c.id === id)).filter(Boolean),
    [channels, recentIds]
  );

  // All channels as StreamChannel[] for the in-player Stream picker
  const streamList = useMemo(() => channels.map(toStreamChannel), [channels]);

  const handleChannelClick = (id: number) => {
    addRecent(id);
    router.push(`/watch/${id}`);
  };

  const handleStreamChange = (stream: StreamChannel) => {
    handleChannelClick(stream.id);
  };

  const primarySrc = activeChannel ? `/api/stream/${activeChannel.id}/playlist.m3u8` : "";

  return (
    <div className="min-h-screen flex flex-col">

      {/* ══════════════════════════════════════════════════════
          HERO: Full-width player
      ══════════════════════════════════════════════════════ */}
      <div
        className="w-full relative border-b border-[#00f0ff]/12"
        style={{ background: "#030306" }}
      >
        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#fcee0a] z-20 pointer-events-none" aria-hidden="true" />
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#00f0ff] z-20 pointer-events-none" aria-hidden="true" />
        <div className="absolute bottom-0 right-0 w-8 h-[2px] bg-[#ff0055] z-20 pointer-events-none" aria-hidden="true" />

        {activeChannel ? (
          <HLSPlayer
            key={activeChannel.id}
            src={primarySrc}
            channelName={activeChannel.name}
            poster={activeChannel.logo || `/api/logo?name=${encodeURIComponent(activeChannel.name)}`}
            autoPlay
            streams={streamList}
            activeChannelId={activeChannel.id}
            onStreamChange={handleStreamChange}
            className="w-full max-h-[75vh] lg:max-h-[calc(100vh-180px)]"
          />
        ) : (
          <div
            className="w-full flex flex-col items-center justify-center text-center py-24 sm:py-32"
            style={{
              backgroundImage: "linear-gradient(rgba(0,240,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(0,240,255,0.04) 1px,transparent 1px)",
              backgroundSize: "28px 28px",
            }}
            aria-label="No channel selected"
          >
            <Radio className="w-12 h-12 text-white/10 mx-auto mb-4" aria-hidden="true" />
            <h2 className="font-cyber font-black text-xl uppercase tracking-widest text-white/30 mb-2">
              No Channel Selected
            </h2>
            <p className="text-white/20 text-xs font-mono">
              {isLoading ? "Loading channels…" : "Pick a channel from the list below"}
            </p>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════
          CHANNEL INFO + LIST
      ══════════════════════════════════════════════════════ */}
      <div className="max-w-[1600px] mx-auto w-full px-4 sm:px-8 md:px-16 py-6 pb-32 flex flex-col lg:flex-row gap-6 lg:gap-10">

        {/* ── Channel Info ── */}
        {activeChannel && (
          <div className="lg:w-72 xl:w-80 shrink-0 space-y-4">

            {/* Info card */}
            <div className="bg-[#09090d] border border-[#00f0ff]/15 p-5">
              {/* Corner accent */}
              <div className="relative">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-14 h-14 shrink-0 border border-white/10 bg-white flex items-center justify-center relative">
                    <img src={activeChannel.logo || `/api/logo?name=${encodeURIComponent(activeChannel.name)}`} alt={activeChannel.name}
                      className="w-10 h-10 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                        const fallbackIcon = (e.target as HTMLImageElement).parentElement?.querySelector(".logo-fallback");
                        if (fallbackIcon) fallbackIcon.classList.remove("hidden");
                      }} />
                    <div className="logo-fallback hidden absolute inset-0 w-full h-full flex items-center justify-center">
                      <Tv className="w-6 h-6 text-black/40" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h2 className="font-cyber font-black text-base text-white uppercase tracking-wide leading-none">
                        {activeChannel.name}
                      </h2>
                      {activeChannel.isLive && <LivePulseBadge size="sm" />}
                    </div>
                    <p className="text-[9px] font-mono text-white/30 uppercase tracking-widest">
                      {activeChannel.category}
                      {activeChannel.quality && <span className="text-[#00f0ff] ml-1.5">· {activeChannel.quality}</span>}
                    </p>
                  </div>
                </div>

                {activeChannel.description && (
                  <p className="text-white/40 text-xs font-sans leading-relaxed mb-4">
                    {activeChannel.description}
                  </p>
                )}

                {/* Meta grid */}
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { icon: Languages, label: "Language", value: activeChannel.language || "Multilingual" },
                    { icon: Globe,     label: "Country",  value: activeChannel.country  || "Global" },
                    { icon: Signal,    label: "Quality",  value: activeChannel.quality  || "Auto" },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-center gap-3 border-b border-white/5 pb-2">
                      <Icon className="w-3.5 h-3.5 text-[#00f0ff]/40 shrink-0" aria-hidden="true" />
                      <span className="text-white/25 text-[9px] font-mono uppercase tracking-wider w-16 shrink-0">{label}</span>
                      <span className="text-white font-cyber font-bold text-[10px]">{value}</span>
                    </div>
                  ))}
                </div>

                {/* Favorite button */}
                <button
                  onClick={() => toggle(activeChannel.id)}
                  aria-pressed={isFavorite(activeChannel.id)}
                  aria-label={isFavorite(activeChannel.id) ? "Remove from favourites" : "Save to favourites"}
                  className={cn(
                    "mt-4 w-full flex items-center justify-center gap-2 py-2.5 text-[10px] font-cyber font-bold uppercase tracking-widest border transition-all duration-200",
                    isFavorite(activeChannel.id)
                      ? "bg-[#ff0055]/12 text-[#ff0055] border-[#ff0055]/35"
                      : "bg-transparent text-white/40 border-white/15 hover:text-[#ff0055] hover:border-[#ff0055]/30"
                  )}
                >
                  <Heart className={cn("w-3.5 h-3.5", isFavorite(activeChannel.id) && "fill-current")} />
                  {isFavorite(activeChannel.id) ? "Saved to Favourites" : "Add to Favourites"}
                </button>
              </div>
            </div>

            {/* Disclaimer card */}
            <div className="bg-[#09090d]/60 border border-[#ff0055]/15 p-4 space-y-1.5">
              <span className="text-[#ff0055] font-cyber font-bold uppercase tracking-wider text-[9px] block">Stream Disclaimer</span>
              <p className="text-[10px] font-sans text-white/35 leading-relaxed">
                This stream is sourced directly from external 3rd-party media providers. FIFA Live Hub does not host, upload, or transmit any video stream content. All liability resides with the respective 3rd-party hosts.
              </p>
            </div>

            {/* Recently watched */}
            {recentChannels.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3 text-white/25" />
                  <span className="text-[9px] font-cyber font-bold text-white/30 uppercase tracking-widest">Recently Watched</span>
                </div>
                <div className="space-y-1">
                  {recentChannels.slice(0, 5).map((ch) => ch && (
                    <MiniChannelRow
                      key={ch.id}
                      channel={ch}
                      isActive={activeChannel.id === ch.id}
                      onClick={() => handleChannelClick(ch.id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Full Channel List ── */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* Header + Search + Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-0.5 h-5 bg-[#00f0ff]" aria-hidden="true" />
              <h3 className="font-cyber font-black text-base uppercase tracking-widest text-white">
                All Channels
              </h3>
              <span className="text-[9px] font-mono text-white/25 border border-white/10 px-1.5 py-0.5">
                {filtered.length}
              </span>
            </div>
            <div className="flex-1" />
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search streams…"
                aria-label="Search channels"
                className="w-full pl-9 pr-3 py-2 bg-[#09090d] border border-[#00f0ff]/15 text-white text-[11px] font-mono placeholder:text-white/20 focus:outline-none focus:border-[#00f0ff]/40 transition-colors"
              />
            </div>
          </div>

          {/* Category pills */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 hide-scrollbar" role="tablist">
            {["All", ...CHANNEL_CATEGORIES].map((cat) => (
              <button key={cat} role="tab" aria-selected={category === cat}
                onClick={() => setCategory(cat)}
                className={cn(
                  "px-3 py-1.5 text-[9px] font-cyber font-bold uppercase tracking-widest whitespace-nowrap border transition-all shrink-0",
                  category === cat
                    ? "bg-[#fcee0a] text-black border-[#fcee0a]"
                    : "bg-transparent border-[#00f0ff]/18 text-white/40 hover:text-[#00f0ff] hover:border-[#00f0ff]/40"
                )}>
                {cat}
              </button>
            ))}
          </div>

          {/* Favourites row */}
          {favorites.size > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 pt-1">
                <Heart className="w-3 h-3 text-[#ff0055]" />
                <span className="text-[9px] font-cyber font-bold text-white/30 uppercase tracking-widest">Favourites</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
                {channels.filter((c) => favorites.has(c.id)).map((ch) => (
                  <ChannelRow
                    key={ch.id}
                    channel={ch}
                    isActive={activeChannel?.id === ch.id}
                    isFav
                    onFavToggle={() => toggle(ch.id)}
                    onClick={() => handleChannelClick(ch.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* All channels grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="h-16 bg-[#09090d] border border-[#00f0ff]/8 skeleton-shimmer" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-[#09090d] border border-[#00f0ff]/10 p-10 text-center">
              <Tv className="w-8 h-8 text-white/10 mx-auto mb-3" />
              <p className="text-white/25 text-xs font-mono">No channels found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
              {filtered.map((ch) => (
                <ChannelRow
                  key={ch.id}
                  channel={ch}
                  isActive={activeChannel?.id === ch.id}
                  isFav={favorites.has(ch.id)}
                  onFavToggle={() => toggle(ch.id)}
                  onClick={() => handleChannelClick(ch.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Mini channel row (sidebar) ────────────────────────────────── */
function MiniChannelRow({
  channel, isActive, onClick,
}: { channel: Channel; isActive: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2 border-l-2 transition-colors text-left hover:bg-[#fcee0a]/5",
        isActive ? "border-[#fcee0a] bg-[#fcee0a]/5" : "border-transparent hover:border-[#00f0ff]/30"
      )}
    >
      <div className="w-6 h-6 relative shrink-0 flex items-center justify-center bg-white border border-white/10">
        <img src={channel.logo || `/api/logo?name=${encodeURIComponent(channel.name)}`} alt="" className="w-full h-full object-contain opacity-70"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
            const fallbackIcon = (e.target as HTMLImageElement).parentElement?.querySelector(".logo-fallback");
            if (fallbackIcon) fallbackIcon.classList.remove("hidden");
          }} />
        <div className="logo-fallback hidden absolute inset-0 w-full h-full flex items-center justify-center">
          <Tv className="w-4 h-4 text-black/40 shrink-0" />
        </div>
      </div>
      <span className={cn(
        "text-[11px] font-cyber font-bold truncate",
        isActive ? "text-[#fcee0a]" : "text-white/55"
      )}>
        {channel.name}
      </span>
      {channel.isLive && (
        <span className="ml-auto shrink-0 text-[7px] font-cyber font-black text-[#ff0055] border border-[#ff0055]/35 px-1">LIVE</span>
      )}
    </button>
  );
}

/* ── Full channel row (grid) ───────────────────────────────────── */
function ChannelRow({
  channel, isActive, isFav, onFavToggle, onClick,
}: {
  channel: Channel; isActive: boolean; isFav: boolean;
  onFavToggle: () => void; onClick: () => void;
}) {
  return (
    <div
      className={cn(
        "relative flex items-center gap-3 px-4 py-3 border bg-[#09090d] group cursor-pointer transition-all duration-200 overflow-hidden",
        isActive
          ? "border-[#00f0ff]/50 shadow-[0_0_16px_rgba(0,240,255,0.08)]"
          : "border-[#00f0ff]/12 hover:border-[#fcee0a]/40 hover:bg-[#fcee0a]/3"
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`Watch ${channel.name}`}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
    >
      {/* Active indicator */}
      {isActive && (
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#00f0ff] to-[#fcee0a]" />
      )}
      {/* Corner */}
      <div className="absolute top-0 left-0 w-1.5 h-1.5 bg-[#fcee0a] opacity-50" />

      <div className="w-10 h-10 shrink-0 flex items-center justify-center bg-white border border-white/8 relative">
        <img src={channel.logo || `/api/logo?name=${encodeURIComponent(channel.name)}`} alt="" className="w-8 h-8 object-contain"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
            const fallbackIcon = (e.target as HTMLImageElement).parentElement?.querySelector(".logo-fallback");
            if (fallbackIcon) fallbackIcon.classList.remove("hidden");
          }} />
        <div className="logo-fallback hidden absolute inset-0 w-full h-full flex items-center justify-center">
          <Tv className="w-4 h-4 text-black/40" />
        </div>
        {isActive && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            {/* Equalizer bars */}
            <div className="flex items-end gap-[2px] h-4">
              <div className="eq-bar eq-bar-1 w-[2px]" />
              <div className="eq-bar eq-bar-2 w-[2px]" />
              <div className="eq-bar eq-bar-3 w-[2px]" />
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className={cn(
            "text-[11px] font-cyber font-bold truncate",
            isActive ? "text-[#00f0ff]" : "text-white/70 group-hover:text-[#fcee0a]"
          )}>
            {channel.name}
          </span>
          {channel.isLive && <LivePulseBadge size="sm" className="shrink-0" />}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[8px] font-mono text-white/25 uppercase">{channel.category}</span>
          {channel.quality && (
            <span className="text-[8px] font-mono text-[#00f0ff]/40 border border-[#00f0ff]/15 px-1">
              {channel.quality}
            </span>
          )}
        </div>
      </div>

      {/* Fav button */}
      <button
        onClick={(e) => { e.stopPropagation(); onFavToggle(); }}
        aria-label={isFav ? `Remove ${channel.name} from favourites` : `Add ${channel.name} to favourites`}
        aria-pressed={isFav}
        className={cn(
          "shrink-0 p-1.5 border border-transparent transition-all",
          isFav
            ? "text-[#ff0055] bg-[#ff0055]/10 border-[#ff0055]/25"
            : "text-white/20 hover:text-[#ff0055] hover:bg-[#ff0055]/8"
        )}
      >
        <Heart className={cn("w-3.5 h-3.5", isFav && "fill-current")} />
      </button>
    </div>
  );
}
