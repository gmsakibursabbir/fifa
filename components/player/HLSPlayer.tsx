"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  PictureInPicture2, Loader2, AlertCircle, RefreshCw,
  Settings, Check, Tv, ChevronRight, X,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Public Types ──────────────────────────────────────────────────── */

export interface StreamChannel {
  id: number;
  name: string;
  logo?: string;
  category?: string;
  quality?: string;
  isLive?: boolean;
  src: string; // proxy or direct URL
}

export interface StreamServer {
  label: string;
  url: string;
}

interface HLSPlayerProps {
  src: string;
  channelName?: string;
  poster?: string;
  autoPlay?: boolean;
  className?: string;
  /** List of all channels to show in the in-player Stream picker */
  streams?: StreamChannel[];
  /** Called when user picks a channel from the Stream picker */
  onStreamChange?: (channel: StreamChannel) => void;
  /** Current active channel id (for highlighting in the list) */
  activeChannelId?: number;
}

/* ─── Stream Type Detection ─────────────────────────────────────────── */
function getStreamType(url: string): "hls" | "mpegts" | "native" {
  if (!url) return "native";
  const cleanUrl = url.split("?")[0].toLowerCase();
  if (
    cleanUrl.endsWith(".m3u8") || url.includes("/m3u8") ||
    url.includes("playlist.m3u8") || url.includes("manifest(format=m3u8-aapl)")
  ) return "hls";
  if (
    cleanUrl.endsWith(".ts") || url.includes("/mpegts") || url.includes("/ts") ||
    cleanUrl.endsWith("/ts") || cleanUrl.endsWith("/mpegts")
  ) {
    if (cleanUrl.endsWith(".ts/index.m3u8") || url.includes(".m3u8")) return "hls";
    return "mpegts";
  }
  return "native";
}

/* ─── Inner Player ──────────────────────────────────────────────────── */
function HLSPlayerInner({
  src,
  channelName,
  poster,
  autoPlay = true,
  className,
  streams = [],
  onStreamChange,
  activeChannelId,
}: HLSPlayerProps) {
  const videoRef     = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef       = useRef<any>(null);
  const mpegtsRef    = useRef<any>(null);
  const timerRef     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recoveryRef  = useRef({ media: 0, network: 0, recreate: 0 });

  const [playing,       setPlaying]       = useState(false);
  const [muted,         setMuted]         = useState(false);
  const [volume,        setVolume]        = useState(1);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState("");
  const [showControls,  setShowControls]  = useState(true);
  const [pipSupported,  setPipSupported]  = useState(false);
  const [retryKey,      setRetryKey]      = useState(0);
  const [isFullscreen,  setIsFullscreen]  = useState(false);

  // Quality
  const [levels,         setLevels]         = useState<{ index: number; name: string }[]>([]);
  const [currentLevel,   setCurrentLevel]   = useState(-1);
  const [showQualityMenu,setShowQualityMenu] = useState(false);

  // Stream picker panel
  const [showStreamPanel, setShowStreamPanel] = useState(false);
  const [streamSearch,    setStreamSearch]    = useState("");

  // Active src (may differ from `src` if user picked via Stream panel)
  const [activeSrc, setActiveSrc] = useState(src);

  // Sync when src prop changes
  useEffect(() => { setActiveSrc(src); }, [src]);

  /* ── Controls auto-hide ─────────────────────────────────────── */
  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (playing && !showStreamPanel) {
        setShowControls(false);
        setShowQualityMenu(false);
      }
    }, 3500);
  }, [playing, showStreamPanel]);

  /* ── PiP / Fullscreen detection ─────────────────────────────── */
  useEffect(() => {
    setPipSupported("pictureInPictureEnabled" in document);
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  /* ── Player setup ───────────────────────────────────────────── */
  const retry = useCallback(() => {
    setError(""); setLoading(true); setRetryKey((p) => p + 1);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !activeSrc) return;

    setLoading(true); setError(""); setPlaying(false);

    let onMeta: (() => void) | null = null;
    let onErr:  (() => void) | null = null;
    let onMetaHls: (() => void) | null = null;

    async function setup() {
      if (!video) return;
      const type = getStreamType(activeSrc);
      setLevels([]); setCurrentLevel(-1); setShowQualityMenu(false);

      if (hlsRef.current)   { hlsRef.current.destroy(); hlsRef.current = null; }
      if (mpegtsRef.current) {
        try { mpegtsRef.current.pause(); mpegtsRef.current.unload();
              mpegtsRef.current.detachMediaElement(); mpegtsRef.current.destroy(); }
        catch {}
        mpegtsRef.current = null;
      }
      video.src = "";

      if (type === "mpegts") {
        const mpegts = (await import("mpegts.js")).default;
        if (mpegts.getFeatureList().mseLivePlayback) {
          const p = mpegts.createPlayer({ type: "mse", isLive: true, url: activeSrc });
          mpegtsRef.current = p;
          p.attachMediaElement(video); p.load(); p.play()?.catch(() => {});
          p.on(mpegts.Events.ERROR, () => {
            if (recoveryRef.current.recreate < 2) { recoveryRef.current.recreate++; retry(); }
            else { setError("Stream unavailable."); setLoading(false); }
          });
          setLoading(false);
        } else { setError("MPEG-TS not supported."); setLoading(false); }

      } else if (type === "hls") {
        const Hls = (await import("hls.js")).default;
        if (Hls.isSupported()) {
          const hls = new Hls({ enableWorker: true, lowLatencyMode: true, backBufferLength: 90 });
          hlsRef.current = hls;
          hls.loadSource(activeSrc); hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            setLoading(false);
            recoveryRef.current = { media: 0, network: 0, recreate: 0 };
            const parsed = hls.levels.map((l: any, i: number) => ({
              index: i, name: l.name || (l.height ? `${l.height}p` : `${Math.round(l.bitrate / 1000)}k`),
            }));
            setLevels(parsed); setCurrentLevel(hls.currentLevel);
            if (autoPlay) video.play().catch(() => {});
          });
          hls.on(Hls.Events.ERROR, (_: unknown, data: any) => {
            if (!data.fatal) return;
            if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
              if (recoveryRef.current.media < 3) {
                recoveryRef.current.media++;
                if (recoveryRef.current.media === 2) hls.swapAudioCodec();
                hls.recoverMediaError();
              } else if (recoveryRef.current.recreate < 2) {
                recoveryRef.current.recreate++; recoveryRef.current.media = 0; retry();
              } else { setError("Stream unavailable. Playback failed to recover."); setLoading(false); }
            } else if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
              if (recoveryRef.current.network < 3) { recoveryRef.current.network++; hls.startLoad(); }
              else if (recoveryRef.current.recreate < 2) {
                recoveryRef.current.recreate++; recoveryRef.current.network = 0; retry();
              } else { setError("Stream unavailable. Network connection lost."); setLoading(false); }
            } else {
              if (recoveryRef.current.recreate < 2) { recoveryRef.current.recreate++; retry(); }
              else { setError("Stream unavailable."); setLoading(false); }
            }
          });
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = activeSrc;
          onMetaHls = () => { setLoading(false); recoveryRef.current = { media:0,network:0,recreate:0 }; if (autoPlay) video.play().catch(()=>{}); };
          video.addEventListener("loadedmetadata", onMetaHls);
        } else { setError("HLS not supported."); setLoading(false); }

      } else {
        video.src = activeSrc; video.load();
        onMeta = () => { setLoading(false); recoveryRef.current = {media:0,network:0,recreate:0}; if (autoPlay) video.play().catch(()=>{}); };
        video.addEventListener("loadedmetadata", onMeta);
        onErr = () => {
          if (recoveryRef.current.recreate < 2) { recoveryRef.current.recreate++; retry(); }
          else { setError("Unsupported format or stream offline."); setLoading(false); }
        };
        video.addEventListener("error", onErr);
      }
    }

    setup().catch((e) => { console.error(e); setError("Failed to load stream."); setLoading(false); });

    return () => {
      if (onMeta)    video.removeEventListener("loadedmetadata", onMeta);
      if (onErr)     video.removeEventListener("error", onErr);
      if (onMetaHls) video.removeEventListener("loadedmetadata", onMetaHls);
      if (hlsRef.current)   { hlsRef.current.destroy(); hlsRef.current = null; }
      if (mpegtsRef.current) {
        try { mpegtsRef.current.pause(); mpegtsRef.current.unload();
              mpegtsRef.current.detachMediaElement(); mpegtsRef.current.destroy(); }
        catch {}
        mpegtsRef.current = null;
      }
    };
  }, [activeSrc, autoPlay, retryKey, retry]);

  /* ── Video event listeners ──────────────────────────────────── */
  useEffect(() => {
    const v = videoRef.current; if (!v) return;
    const onPlay    = () => setPlaying(true);
    const onPause   = () => setPlaying(false);
    const onWaiting = () => setLoading(true);
    const onPlaying = () => { setLoading(false); recoveryRef.current = {media:0,network:0,recreate:0}; };
    const onTime    = () => { if (v.currentTime > 0) { setLoading(false); setPlaying(true); recoveryRef.current = {media:0,network:0,recreate:0}; } };
    v.addEventListener("play",       onPlay);
    v.addEventListener("pause",      onPause);
    v.addEventListener("waiting",    onWaiting);
    v.addEventListener("playing",    onPlaying);
    v.addEventListener("timeupdate", onTime);
    return () => {
      v.removeEventListener("play",       onPlay);
      v.removeEventListener("pause",      onPause);
      v.removeEventListener("waiting",    onWaiting);
      v.removeEventListener("playing",    onPlaying);
      v.removeEventListener("timeupdate", onTime);
    };
  }, []);

  /* ── Controls ───────────────────────────────────────────────── */
  const togglePlay = () => { const v = videoRef.current; if (!v) return; v.paused ? v.play().catch(()=>{}) : v.pause(); };
  const toggleMute = () => { const v = videoRef.current; if (!v) return; v.muted = !v.muted; setMuted(v.muted); };
  const changeVolume = (val: number) => { const v = videoRef.current; if (!v) return; v.volume=val; setVolume(val); setMuted(val===0); };
  const toggleFullscreen = async () => {
    const el = containerRef.current; if (!el) return;
    if (!document.fullscreenElement) await el.requestFullscreen().catch(()=>{});
    else await document.exitFullscreen().catch(()=>{});
  };
  const togglePiP = async () => {
    const v = videoRef.current; if (!v) return;
    if (document.pictureInPictureElement) await document.exitPictureInPicture().catch(()=>{});
    else await v.requestPictureInPicture().catch(()=>{});
  };
  const handleQualityChange = (idx: number) => {
    if (hlsRef.current) { hlsRef.current.currentLevel = idx; setCurrentLevel(idx); }
    setShowQualityMenu(false);
  };

  /* ── Stream picker filter ───────────────────────────────────── */
  const filteredStreams = streams.filter((s) =>
    !streamSearch || s.name.toLowerCase().includes(streamSearch.toLowerCase())
  );

  /* ── Render ─────────────────────────────────────────────────── */
  return (
    <div
      ref={containerRef}
      className={cn("relative bg-black overflow-hidden group select-none", className)}
      style={{ aspectRatio: "16/9" }}
      onMouseMove={resetControlsTimer}
      onMouseEnter={() => setShowControls(true)}
      onTouchStart={resetControlsTimer}
    >
      {/* VIDEO */}
      <video
        ref={videoRef}
        poster={poster}
        playsInline
        className="w-full h-full object-contain"
        onClick={togglePlay}
      />

      {/* ── LOADING ── */}
      {loading && !error && (
        <div className="absolute inset-0 bg-[#030306]/95 z-30 flex items-center justify-center overflow-hidden">
          {/* Holographic BG Grid */}
          <div
            className="absolute inset-0 opacity-[0.08] pointer-events-none"
            style={{
              backgroundImage: "linear-gradient(rgba(0,240,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(0,240,255,0.08) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
            aria-hidden="true"
          />

          {/* Horizontal laser scanline */}
          <div className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#00f0ff] to-transparent opacity-60 animate-laser-sweep pointer-events-none z-10" />

          {/* Corner frames */}
          <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-[#00f0ff]/30 pointer-events-none" />
          <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-[#00f0ff]/30 pointer-events-none" />
          <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-[#00f0ff]/30 pointer-events-none" />
          <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-[#00f0ff]/30 pointer-events-none" />

          {/* Center console box */}
          <div
            className="relative max-w-[280px] w-[90%] bg-black/75 border border-[#00f0ff]/25 p-5 flex flex-col items-center select-none backdrop-blur-md shadow-[0_0_30px_rgba(0,240,255,0.08)]"
            style={{ clipPath: "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))" }}
          >
            {/* Box Accent brackets */}
            <div className="absolute top-0 left-0 w-3.5 h-3.5 border-t-2 border-l-2 border-[#fcee0a]" />
            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 border-b-2 border-r-2 border-[#fcee0a]" />

            {/* Neon flashing indicator */}
            <div className="absolute -top-3 right-6 bg-[#ff0055] text-white font-cyber font-black text-[7px] tracking-widest px-2 py-0.5 animate-pulse border border-[#ff0055]/30">
              STREAMS_CONNECT
            </div>

            {/* Rotating target reticle */}
            <div className="cyber-reticle mb-4" />

            {/* Title */}
            <div className="font-cyber font-black text-[12px] uppercase tracking-widest text-white mb-0.5">
              Establishing <span className="neon-cyan shadow-glow text-[#00f0ff]">Neural Link</span>
            </div>
            <p className="text-[7.5px] font-mono text-[#fcee0a] uppercase tracking-widest mb-4 animate-pulse">
              [ accessing network stream ]
            </p>

            {/* Diagnostic readout block */}
            <div className="w-full bg-[#07070b] border border-[#00f0ff]/15 p-3 font-mono text-[8.5px] text-white/50 space-y-1.5 text-left relative">
              <div className="absolute top-0 right-0 w-1 h-1 bg-[#00f0ff]/40" />

              <div className="flex justify-between items-center">
                <span>SYSTEM_STATUS</span>
                <span className="text-[#39ff14] font-bold">ONLINE</span>
              </div>
              <div className="flex justify-between items-center">
                <span>DECRYPTION_CORE</span>
                <span className="text-[#00f0ff] animate-pulse">ESTABLISHED</span>
              </div>
              <div className="flex justify-between items-center">
                <span>BITRATE_BUFFER</span>
                <span className="text-[#fcee0a]">SYNCING...</span>
              </div>
              <div className="flex justify-between items-center border-t border-[#00f0ff]/10 pt-1.5 text-white/30 text-[7.5px]">
                <span>PROTOCOL: MPEG-TS/HLS</span>
                <span className="truncate max-w-[80px]">CH: {channelName || "IPTV"}</span>
              </div>
            </div>

            {/* High-tech segment loading bar */}
            <div className="w-full mt-4 space-y-1">
              <div className="flex justify-between text-[8px] font-mono text-white/45 uppercase tracking-wider">
                <span>Connecting Decryptor</span>
                <span className="animate-pulse text-[#fcee0a] font-bold">89%</span>
              </div>
              {/* Segmented cells */}
              <div className="flex gap-[3px] h-2 w-full">
                {[...Array(12)].map((_, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "flex-1 h-full border border-white/5",
                      idx < 9
                        ? "bg-[#fcee0a] border-[#fcee0a]/50 shadow-[0_0_3px_#fcee0a]"
                        : "bg-white/5"
                    )}
                    style={{
                      animation: idx === 8 ? "pulse 0.8s infinite alternate" : "none"
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── ERROR ── */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 gap-4 p-4 z-10">
          <AlertCircle className="w-10 h-10 text-[#ff0055]" />
          <p className="text-white/70 text-xs text-center max-w-xs font-mono leading-relaxed">{error}</p>
          <button
            onClick={retry}
            className="flex items-center gap-2 px-5 py-2 bg-transparent border border-[#00f0ff] text-[#00f0ff] text-[10px] font-cyber font-bold uppercase tracking-widest hover:bg-[#00f0ff]/10 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry Stream
          </button>
        </div>
      )}

      {/* ── STREAM PICKER PANEL ── */}
      {showStreamPanel && (
        <div
          className="absolute inset-y-0 right-0 w-72 sm:w-80 flex flex-col bg-[#07070b]/98 border-l border-[#00f0ff]/20 z-30"
          style={{ backdropFilter: "blur(12px)" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Panel header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#00f0ff]/15 shrink-0">
            <div className="flex items-center gap-2">
              <Tv className="w-3.5 h-3.5 text-[#00f0ff]" />
              <span className="font-cyber font-bold text-[11px] uppercase tracking-widest text-[#00f0ff]">
                Streams
              </span>
              <span className="text-[9px] font-mono text-white/30 border border-white/15 px-1">
                {streams.length}
              </span>
            </div>
            <button
              onClick={() => setShowStreamPanel(false)}
              aria-label="Close stream panel"
              className="text-white/40 hover:text-[#ff0055] transition-colors p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search */}
          <div className="px-3 py-2 border-b border-[#00f0ff]/10 shrink-0">
            <input
              type="search"
              value={streamSearch}
              onChange={(e) => setStreamSearch(e.target.value)}
              placeholder="Search channels…"
              aria-label="Search channels"
              className="w-full px-3 py-1.5 bg-white/5 border border-[#00f0ff]/15 text-white text-[10px] font-mono placeholder:text-white/25 focus:outline-none focus:border-[#00f0ff]/40 transition-colors"
            />
          </div>

          {/* Channel list */}
          <div className="flex-1 overflow-y-auto scrollbar-cyber">
            {filteredStreams.length === 0 ? (
              <div className="flex items-center justify-center h-24 text-white/25 text-xs font-mono">
                No channels found
              </div>
            ) : (
              filteredStreams.map((ch) => {
                const isActive = activeChannelId === ch.id;
                return (
                  <button
                    key={ch.id}
                    onClick={() => {
                      setActiveSrc(ch.src);
                      if (onStreamChange) onStreamChange(ch);
                      setShowStreamPanel(false);
                      setStreamSearch("");
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-2.5 text-left border-l-2 transition-colors hover:bg-[#fcee0a]/5",
                      isActive
                        ? "border-[#fcee0a] bg-[#fcee0a]/8"
                        : "border-transparent hover:border-[#00f0ff]/40"
                    )}
                  >
                    {/* Logo */}
                    <div className="w-8 h-8 shrink-0 flex items-center justify-center bg-white/5 border border-white/10">
                      {ch.logo ? (
                        <img src={ch.logo} alt="" className="w-6 h-6 object-contain"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      ) : (
                        <Tv className="w-4 h-4 text-white/20" />
                      )}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className={cn(
                        "text-[11px] font-cyber font-bold truncate",
                        isActive ? "text-[#fcee0a]" : "text-white/70"
                      )}>
                        {ch.name}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {ch.isLive && (
                          <span className="text-[7px] font-cyber font-black text-[#ff0055] border border-[#ff0055]/35 px-1 leading-tight">LIVE</span>
                        )}
                        {ch.quality && (
                          <span className="text-[8px] font-mono text-white/25">{ch.quality}</span>
                        )}
                        {ch.category && (
                          <span className="text-[8px] font-mono text-white/20 truncate">{ch.category}</span>
                        )}
                      </div>
                    </div>
                    {isActive && <Check className="w-3.5 h-3.5 text-[#fcee0a] shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ── CONTROLS OVERLAY ── */}
      <div
        className={cn(
          "absolute inset-0 flex flex-col justify-end transition-opacity duration-300 player-controls z-20",
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        {/* Channel name top-left */}
        {channelName && (
          <div className="absolute top-3 left-3">
            <span className="text-white font-cyber font-bold text-[10px] uppercase tracking-widest bg-black/70 border border-[#00f0ff]/25 px-2.5 py-1">
              {channelName}
            </span>
          </div>
        )}

        {/* Control bar */}
        <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 pb-3.5 pt-10">

          {/* Play/Pause */}
          <button id="player-play-pause" onClick={togglePlay} aria-label={playing ? "Pause" : "Play"}
            className="text-[#00f0ff] hover:text-[#fcee0a] hover:bg-[#fcee0a]/10 hover:border-[#fcee0a]/40 border border-transparent transition-all p-1.5 flex items-center justify-center shrink-0">
            {playing ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
          </button>

          {/* Volume */}
          <button id="player-mute" onClick={toggleMute} aria-label={muted ? "Unmute" : "Mute"}
            className="text-[#00f0ff] hover:text-[#fcee0a] hover:bg-[#fcee0a]/10 hover:border-[#fcee0a]/40 border border-transparent transition-all p-1.5 flex items-center justify-center shrink-0">
            {muted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <input type="range" min={0} max={1} step={0.05} value={muted ? 0 : volume}
            onChange={(e) => changeVolume(Number(e.target.value))}
            className="w-16 sm:w-20 cyber-slider self-center" aria-label="Volume" />

          <div className="flex-1" />

          {/* ── STREAM PICKER BUTTON ── */}
          {streams.length > 0 && (
            <button
              id="player-stream"
              onClick={() => { setShowStreamPanel(!showStreamPanel); setShowQualityMenu(false); }}
              aria-expanded={showStreamPanel}
              aria-label="Change stream / channel"
              title="Change Stream"
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 border text-[9px] font-cyber font-black uppercase tracking-widest transition-all duration-200",
                showStreamPanel
                  ? "border-[#fcee0a] text-[#fcee0a] bg-[#fcee0a]/12"
                  : "border-[#00f0ff]/50 text-[#00f0ff] hover:border-[#fcee0a] hover:text-[#fcee0a]"
              )}
            >
              <Tv className="w-3 h-3" />
              <span>Stream</span>
            </button>
          )}

          {/* Quality */}
          {levels.length > 0 && (
            <div className="relative flex items-center">
              <button id="player-settings"
                onClick={() => { setShowQualityMenu(!showQualityMenu); setShowStreamPanel(false); }}
                aria-label="Quality settings"
                className={cn(
                  "text-[#00f0ff] hover:text-[#fcee0a] hover:bg-[#fcee0a]/10 hover:border-[#fcee0a]/40 border border-transparent transition-all p-1.5 flex items-center justify-center shrink-0",
                  showQualityMenu && "text-[#fcee0a] bg-[#fcee0a]/10 border-[#fcee0a]/40"
                )}>
                <Settings className="w-4 h-4" />
              </button>
              {showQualityMenu && (
                <div className="absolute bottom-10 right-0 mb-2 w-40 bg-[#07070b]/98 border border-[#00f0ff]/25 z-50">
                  <div className="px-3 py-2 text-[9px] font-cyber font-bold text-[#00f0ff]/60 border-b border-[#00f0ff]/10 uppercase tracking-widest">
                    Quality
                  </div>
                  <div className="max-h-44 overflow-y-auto scrollbar-cyber">
                    <button onClick={() => handleQualityChange(-1)}
                      className={cn("w-full text-left px-3 py-2 text-[10px] font-cyber font-bold transition-colors hover:bg-[#00f0ff]/8 flex items-center justify-between uppercase tracking-wider",
                        currentLevel === -1 ? "text-[#fcee0a]" : "text-white/60")}>
                      <span>Auto</span>
                      {currentLevel === -1 && <span className="w-1.5 h-1.5 bg-[#fcee0a]" />}
                    </button>
                    {levels.map((lvl) => (
                      <button key={lvl.index} onClick={() => handleQualityChange(lvl.index)}
                        className={cn("w-full text-left px-3 py-2 text-[10px] font-cyber font-bold transition-colors hover:bg-[#00f0ff]/8 flex items-center justify-between uppercase tracking-wider",
                          currentLevel === lvl.index ? "text-[#fcee0a]" : "text-white/60")}>
                        <span>{lvl.name}</span>
                        {currentLevel === lvl.index && <span className="w-1.5 h-1.5 bg-[#fcee0a]" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PiP */}
          {pipSupported && (
            <button id="player-pip" onClick={togglePiP} aria-label="Picture in Picture"
              className="text-[#00f0ff] hover:text-[#fcee0a] hover:bg-[#fcee0a]/10 hover:border-[#fcee0a]/40 border border-transparent transition-all p-1.5 flex items-center justify-center shrink-0">
              <PictureInPicture2 className="w-4 h-4" />
            </button>
          )}

          {/* Fullscreen */}
          <button id="player-fullscreen" onClick={toggleFullscreen}
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            className="text-[#00f0ff] hover:text-[#fcee0a] hover:bg-[#fcee0a]/10 hover:border-[#fcee0a]/40 border border-transparent transition-all p-1.5 flex items-center justify-center shrink-0">
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Click to play overlay */}
      {!playing && !loading && !error && (
        <button onClick={togglePlay} className="absolute inset-0 flex items-center justify-center z-10" aria-label="Play stream">
          <div className="w-16 h-16 bg-black/60 border border-[#00f0ff]/40 hover:border-[#fcee0a] flex items-center justify-center transition-colors"
            style={{ clipPath: "polygon(50% 0, 100% 50%, 50% 100%, 0 50%)" }}>
            <Play className="w-7 h-7 text-[#fcee0a] fill-[#fcee0a] ml-1.5" />
          </div>
        </button>
      )}
    </div>
  );
}

const HLSPlayer = dynamic(() => Promise.resolve(HLSPlayerInner), { ssr: false });
export default HLSPlayer;
