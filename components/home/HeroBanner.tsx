"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import {
  Tv, Play, ChevronDown, Maximize2, Zap, Radio, Signal,
  Activity, Globe, Trophy
} from "lucide-react";
import type { Channel } from "@/types/channel";

const HLSPlayer = dynamic(() => import("@/components/player/HLSPlayer"), { ssr: false });

export default function HeroBanner() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [showChannelPicker, setShowChannelPicker] = useState(false);
  const [playerStarted, setPlayerStarted] = useState(false);
  const [channelsLoading, setChannelsLoading] = useState(true);

  useEffect(() => {
    async function loadChannels() {
      try {
        const res = await fetch("/api/channels");
        if (res.ok) {
          const data = (await res.json()) as Channel[];
          const liveChannels = data.filter((c) => c.isLive || c.featured).slice(0, 20);
          setChannels(liveChannels);
          if (liveChannels.length > 0) setActiveChannel(liveChannels[0]);
        }
      } catch (err) {
        console.error("Failed to load channels:", err);
      } finally {
        setChannelsLoading(false);
      }
    }
    loadChannels();
  }, []);

  const getStreamSrc = (ch: Channel) =>
    ch.stream ? `/api/stream/${ch.id}/playlist.m3u8` : "";

  // Build stream list for in-player channel picker
  const streamList = channels.map((ch) => ({
    id:       ch.id,
    name:     ch.name,
    logo:     ch.logo,
    category: ch.category,
    quality:  ch.quality,
    isLive:   ch.isLive,
    src:      `/api/stream/${ch.id}/playlist.m3u8`,
  }));

  return (
    <div
      className="w-full p-[1px] bg-[#00f0ff]/18"
      style={{
        clipPath: "polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px))",
      }}
    >
      <section
        aria-label="Live IPTV player"
        className="relative w-full bg-[#030306] overflow-hidden"
        style={{
          clipPath: "polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px))",
        }}
      >
      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-[#fcee0a] z-20 pointer-events-none" aria-hidden="true" />
      <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-[#00f0ff] z-20 pointer-events-none" aria-hidden="true" />
      <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-[#00f0ff] z-20 pointer-events-none" aria-hidden="true" />
      <div className="absolute bottom-0 right-0 w-8 h-[2px] bg-[#ff0055] z-20 pointer-events-none" aria-hidden="true" />

      <div className="flex flex-col lg:flex-row">

        {/* ── LEFT: Info panel ── */}
        <div
          className="relative flex flex-col justify-between px-6 py-8 sm:px-8 sm:py-10 lg:w-72 xl:w-80 shrink-0 border-b lg:border-b-0 lg:border-r border-[#00f0ff]/10 overflow-hidden"
        >
          {/* BG grid */}
          <div
            className="absolute inset-0 pointer-events-none opacity-25"
            style={{
              backgroundImage: "linear-gradient(rgba(0,240,255,0.06) 1px,transparent 1px),linear-gradient(90deg,rgba(0,240,255,0.06) 1px,transparent 1px)",
              backgroundSize: "24px 24px",
            }}
            aria-hidden="true"
          />

          {/* Top: branding */}
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-1.5 h-1.5 bg-[#ff0055] animate-ping" aria-hidden="true" />
              <span className="cyber-tag cyber-tag-magenta">Live TV</span>
            </div>

            <h2 className="font-cyber font-black text-xl sm:text-2xl xl:text-3xl text-white uppercase leading-tight mb-3">
              <span className="neon-cyan">IPTV</span>{" "}
              <span className="text-white">Stream</span>
            </h2>
            <p className="text-white/40 text-xs sm:text-sm font-sans leading-relaxed mb-6">
              Watch live TV channels directly in your browser. Select a channel below and click play.
            </p>

            {/* Stats */}
            <div className="space-y-3">
              {[
                { icon: Signal,   label: "Live Channels", value: channels.length > 0 ? `${channels.length} Online` : "Loading…" },
                { icon: Tv,       label: "Stream Quality", value: activeChannel?.quality || "Auto" },
                { icon: Activity, label: "Category",       value: activeChannel?.category || "—" },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="w-7 h-7 flex items-center justify-center border border-[#00f0ff]/20 bg-[#00f0ff]/5 shrink-0">
                    <Icon className="w-3.5 h-3.5 text-[#00f0ff]/60" aria-hidden="true" />
                  </div>
                  <div>
                    <div className="text-white font-cyber font-bold text-xs leading-none">{value}</div>
                    <div className="text-white/30 text-[9px] uppercase tracking-widest mt-0.5 font-mono">{label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom: quick links */}
          <div className="relative z-10 mt-8 pt-6 border-t border-[#00f0ff]/10 flex flex-col gap-2">
            <Link
              href="/watch"
              aria-label="Browse all channels"
              className="cyber-btn cyber-btn-cyan w-full justify-center text-[10px]"
            >
              <Tv className="w-3.5 h-3.5" aria-hidden="true" />
              All Channels
            </Link>
            <Link
              href="/matches"
              aria-label="View live matches"
              className="cyber-btn w-full justify-center text-[10px]"
            >
              <Activity className="w-3.5 h-3.5" aria-hidden="true" />
              Live Matches
            </Link>
          </div>
        </div>

        {/* ── RIGHT: Player panel ── */}
        <div className="flex-1 flex flex-col min-w-0">

          {/* Player header bar */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#00f0ff]/10 bg-[#07070b]">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-1.5 h-1.5 bg-[#ff0055] animate-ping shrink-0" aria-hidden="true" />
              <span className="font-cyber text-[10px] font-bold uppercase tracking-widest text-[#00f0ff] truncate">
                {activeChannel ? activeChannel.name : "No channel selected"}
              </span>
              {activeChannel?.isLive && (
                <span className="cyber-tag cyber-tag-magenta shrink-0">LIVE</span>
              )}
            </div>
            {activeChannel && (
              <Link
                href={`/watch/${activeChannel.id}`}
                aria-label="Open full player"
                className="flex items-center gap-1.5 text-[9px] font-cyber font-bold uppercase tracking-widest text-[#fcee0a]/70 hover:text-[#fcee0a] transition-colors shrink-0 ml-4"
              >
                <Maximize2 className="w-3 h-3" aria-hidden="true" />
                Full Screen
              </Link>
            )}
          </div>

          {/* Video player */}
          <div className="relative bg-black flex-1">
            {playerStarted && activeChannel && activeChannel.stream ? (
              <HLSPlayer
                src={getStreamSrc(activeChannel)}
                channelName={activeChannel.name}
                poster={activeChannel.logo}
                autoPlay
                streams={streamList}
                activeChannelId={activeChannel.id}
                onStreamChange={(s) => {
                  const found = channels.find((c) => c.id === s.id);
                  if (found) {
                    setActiveChannel(found);
                    setPlayerStarted(true);
                  }
                }}
                className="w-full"
              />
            ) : (
              /* Splash / idle screen */
              <div
                className="relative w-full flex items-center justify-center bg-[#07070b] overflow-hidden"
                style={{ aspectRatio: "16/9" }}
              >
                {/* Channel logo bg blur */}
                {activeChannel?.logo && (
                  <img
                    src={activeChannel.logo}
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 w-full h-full object-cover opacity-[0.04] scale-110 blur-sm"
                  />
                )}
                {/* Grid overlay */}
                <div
                  className="absolute inset-0 opacity-25"
                  style={{
                    backgroundImage: "linear-gradient(rgba(0,240,255,0.07) 1px,transparent 1px),linear-gradient(90deg,rgba(0,240,255,0.07) 1px,transparent 1px)",
                    backgroundSize: "28px 28px",
                  }}
                  aria-hidden="true"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/50" aria-hidden="true" />

                {/* Scanlines */}
                <div
                  className="absolute inset-0 pointer-events-none opacity-20"
                  style={{ backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.2) 3px,rgba(0,0,0,0.2) 4px)" }}
                  aria-hidden="true"
                />

                {channelsLoading ? (
                  /* Loading state */
                  <div className="relative z-10 flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-[#00f0ff]/30 border-t-[#00f0ff] animate-spin" aria-label="Loading channels" />
                    <span className="font-cyber text-[10px] font-bold uppercase tracking-widest text-[#00f0ff]/60">
                      Loading channels…
                    </span>
                  </div>
                ) : channels.length > 0 ? (
                  /* Play button */
                  <button
                    onClick={() => setPlayerStarted(true)}
                    aria-label={`Play ${activeChannel?.name || "live stream"}`}
                    className="relative z-10 flex flex-col items-center gap-4 group"
                  >
                    <motion.div
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.95 }}
                      className="relative w-20 h-20 flex items-center justify-center border-2 border-[#00f0ff]/40 group-hover:border-[#fcee0a] transition-all duration-300 bg-black/50"
                      style={{ clipPath: "polygon(50% 0, 100% 50%, 50% 100%, 0 50%)" }}
                    >
                      <Play className="w-8 h-8 text-[#fcee0a] fill-[#fcee0a] ml-1.5" aria-hidden="true" />
                    </motion.div>
                    <div className="text-center">
                      <div className="text-white font-cyber font-black text-base sm:text-lg">{activeChannel?.name}</div>
                      <div className="text-[#00f0ff]/60 text-[10px] font-mono uppercase tracking-widest mt-1">
                        Click to start stream
                      </div>
                    </div>
                  </button>
                ) : (
                  /* No channels configured */
                  <div className="relative z-10 text-center px-6">
                    <Radio className="w-10 h-10 text-white/15 mx-auto mb-3" aria-hidden="true" />
                    <p className="text-white/30 text-sm font-cyber font-bold uppercase tracking-wider mb-2">No Live Channels</p>
                    <p className="text-white/20 text-xs font-mono mb-4">Add channels from the admin panel to watch live TV</p>
                    <Link
                      href="/admin"
                      className="cyber-btn cyber-btn-cyan text-[10px]"
                    >
                      Configure IPTV →
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Channel selector bar */}
          {channels.length > 1 && (
            <div className="relative border-t border-[#00f0ff]/10">
              <button
                onClick={() => setShowChannelPicker(!showChannelPicker)}
                aria-expanded={showChannelPicker}
                aria-controls="channel-picker"
                aria-label="Select a channel"
                className="w-full flex items-center justify-between gap-3 px-4 py-2.5 bg-[#09090d] hover:bg-[#0c0c14] transition-colors text-left group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {activeChannel?.logo && (
                    <img
                      src={activeChannel.logo}
                      alt=""
                      aria-hidden="true"
                      className="w-5 h-5 object-contain opacity-70"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  )}
                  <span className="text-white/70 text-[11px] font-cyber font-bold truncate group-hover:text-[#fcee0a] transition-colors">
                    {activeChannel?.name || "Select Channel"}
                  </span>
                  {activeChannel?.quality && (
                    <span className="text-[8px] font-mono text-[#00f0ff]/50 border border-[#00f0ff]/20 px-1 shrink-0">
                      {activeChannel.quality}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[9px] font-mono text-white/25 hidden sm:block">
                    {channels.length} channels
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-[#00f0ff]/50 transition-transform duration-200 ${showChannelPicker ? "rotate-180" : ""}`}
                    aria-hidden="true"
                  />
                </div>
              </button>

              {/* Dropdown */}
              <AnimatePresence>
                {showChannelPicker && (
                  <motion.div
                    id="channel-picker"
                    role="listbox"
                    aria-label="Channel list"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.15 }}
                    className="absolute bottom-full left-0 right-0 bg-[#09090d] border border-[#00f0ff]/20 z-30 max-h-56 overflow-y-auto scrollbar-cyber shadow-[0_-8px_30px_rgba(0,0,0,0.8)]"
                  >
                    {/* Header */}
                    <div className="px-4 py-2 border-b border-[#00f0ff]/10 flex items-center justify-between">
                      <span className="text-[9px] font-cyber font-bold uppercase tracking-widest text-[#00f0ff]/50">
                        Select Channel
                      </span>
                      <span className="text-[9px] font-mono text-white/20">{channels.length} available</span>
                    </div>

                    {channels.map((ch) => (
                      <button
                        key={ch.id}
                        role="option"
                        aria-selected={activeChannel?.id === ch.id}
                        onClick={() => {
                          setActiveChannel(ch);
                          setPlayerStarted(false);
                          setShowChannelPicker(false);
                          setTimeout(() => setPlayerStarted(true), 80);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-[#fcee0a]/5 border-l-2 ${
                          activeChannel?.id === ch.id
                            ? "border-[#00f0ff] bg-[#00f0ff]/6"
                            : "border-transparent"
                        }`}
                      >
                        {ch.logo ? (
                          <img
                            src={ch.logo}
                            alt=""
                            aria-hidden="true"
                            className="w-5 h-5 object-contain opacity-70 shrink-0"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                          />
                        ) : (
                          <Tv className="w-4 h-4 text-white/20 shrink-0" aria-hidden="true" />
                        )}
                        <span
                          className={`text-[11px] font-cyber font-bold truncate flex-1 ${
                            activeChannel?.id === ch.id ? "text-[#00f0ff]" : "text-white/60"
                          }`}
                        >
                          {ch.name}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {ch.isLive && (
                            <span className="text-[8px] font-cyber font-black text-[#ff0055] border border-[#ff0055]/30 px-1 leading-tight">
                              LIVE
                            </span>
                          )}
                          {ch.quality && (
                            <span className="text-[8px] font-mono text-white/25">{ch.quality}</span>
                          )}
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </section>
  </div>
  );
}
