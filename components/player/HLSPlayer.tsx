"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  PictureInPicture2,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface HLSPlayerProps {
  src: string;
  channelName?: string;
  poster?: string;
  autoPlay?: boolean;
  className?: string;
}

function getStreamType(url: string): "hls" | "mpegts" | "native" {
  if (!url) return "native";
  const cleanUrl = url.split("?")[0].toLowerCase();
  
  if (
    cleanUrl.endsWith(".m3u8") ||
    url.includes("/m3u8") ||
    url.includes("playlist.m3u8") ||
    url.includes("manifest(format=m3u8-aapl)")
  ) {
    return "hls";
  }
  
  if (
    cleanUrl.endsWith(".ts") ||
    url.includes("/mpegts") ||
    url.includes("/ts") ||
    cleanUrl.endsWith("/ts") ||
    cleanUrl.endsWith("/mpegts")
  ) {
    if (cleanUrl.endsWith(".ts/index.m3u8") || url.includes(".m3u8")) {
      return "hls";
    }
    return "mpegts";
  }
  
  return "native";
}

function HLSPlayerInner({
  src,
  channelName,
  poster,
  autoPlay = true,
  className,
}: HLSPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<{ destroy: () => void } | null>(null);
  const mpegtsPlayerRef = useRef<any>(null);
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showControls, setShowControls] = useState(true);
  const [pipSupported, setPipSupported] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(() => {
      if (playing) setShowControls(false);
    }, 3000);
  }, [playing]);

  useEffect(() => {
    setPipSupported("pictureInPictureEnabled" in document);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    setLoading(true);
    setError("");
    setPlaying(false);

    async function setup() {
      const type = getStreamType(src);

      // Reset existing player instances
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      if (mpegtsPlayerRef.current) {
        try {
          mpegtsPlayerRef.current.pause();
          mpegtsPlayerRef.current.unload();
          mpegtsPlayerRef.current.detachMediaElement();
          mpegtsPlayerRef.current.destroy();
        } catch (e) {
          console.error("mpegts clean error:", e);
        }
        mpegtsPlayerRef.current = null;
      }

      // Reset native video source
      video!.src = "";

      if (type === "mpegts") {
        const mpegts = (await import("mpegts.js")).default;
        if (mpegts.getFeatureList().mseLivePlayback) {
          const player = mpegts.createPlayer({
            type: "mse",
            isLive: true,
            url: src,
          });
          mpegtsPlayerRef.current = player;
          player.attachMediaElement(video!);
          player.load();
          const playResult = player.play();
          if (playResult && typeof playResult.catch === "function") {
            playResult.catch(() => {});
          }

          player.on(mpegts.Events.ERROR, (errType, errDetail, errInfo) => {
            console.error("mpegts error:", errType, errDetail, errInfo);
            setError("Stream unavailable. This stream may be offline or blocked by CORS restrictions.");
            setLoading(false);
          });
          setLoading(false);
        } else {
          setError("MPEG-TS streaming is not supported on this browser/device.");
          setLoading(false);
        }
      } else if (type === "hls") {
        const Hls = (await import("hls.js")).default;
        if (Hls.isSupported()) {
          const hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 90,
          });
          hlsRef.current = hls;
          hls.loadSource(src);
          hls.attachMedia(video!);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            setLoading(false);
            if (autoPlay) video!.play().catch(() => {});
          });
          hls.on(Hls.Events.ERROR, (_: unknown, data: { fatal: boolean }) => {
            if (data.fatal) {
              setError("Stream unavailable. Please try another channel or check CORS permissions.");
              setLoading(false);
            }
          });
        } else if (video!.canPlayType("application/vnd.apple.mpegurl")) {
          video!.src = src;
          video!.addEventListener("loadedmetadata", () => {
            setLoading(false);
            if (autoPlay) video!.play().catch(() => {});
          });
        } else {
          setError("HLS streaming is not supported in your browser.");
          setLoading(false);
        }
      } else {
        // Native fallback (e.g. mp4, webm)
        video!.src = src;
        video!.load();
        video!.addEventListener("loadedmetadata", () => {
          setLoading(false);
          if (autoPlay) video!.play().catch(() => {});
        });
        video!.addEventListener("error", () => {
          setError("Unsupported media format or stream is offline.");
          setLoading(false);
        });
      }
    }

    setup().catch((e) => {
      console.error(e);
      setError("Failed to load stream.");
      setLoading(false);
    });

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      if (mpegtsPlayerRef.current) {
        try {
          mpegtsPlayerRef.current.pause();
          mpegtsPlayerRef.current.unload();
          mpegtsPlayerRef.current.detachMediaElement();
          mpegtsPlayerRef.current.destroy();
        } catch (e) {
          console.error("mpegts clean error:", e);
        }
        mpegtsPlayerRef.current = null;
      }
    };
  }, [src, autoPlay, retryKey]);

  // Video event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onPlay    = () => setPlaying(true);
    const onPause   = () => setPlaying(false);
    const onWaiting = () => setLoading(true);
    const onPlaying = () => setLoading(false);
    const onTimeUpdate = () => {
      if (video.currentTime > 0) {
        setLoading(false);
        setPlaying(true);
      }
    };
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("waiting", onWaiting);
    video.addEventListener("playing", onPlaying);
    video.addEventListener("timeupdate", onTimeUpdate);
    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("timeupdate", onTimeUpdate);
    };
  }, []);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  const changeVolume = (val: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = val;
    setVolume(val);
    setMuted(val === 0);
  };

  const toggleFullscreen = async () => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      await el.requestFullscreen().catch(() => {});
    } else {
      await document.exitFullscreen().catch(() => {});
    }
  };

  const togglePiP = async () => {
    const v = videoRef.current;
    if (!v) return;
    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture().catch(() => {});
    } else {
      await v.requestPictureInPicture().catch(() => {});
    }
  };

  const retry = () => {
    setError("");
    setLoading(true);
    setRetryKey((prev) => prev + 1);
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative bg-black rounded-2xl overflow-hidden group select-none",
        className
      )}
      onMouseMove={resetControlsTimer}
      onMouseEnter={() => setShowControls(true)}
      onTouchStart={resetControlsTimer}
    >
      <video
        ref={videoRef}
        poster={poster}
        playsInline
        className="w-full h-full object-contain"
        onClick={togglePlay}
        style={{ aspectRatio: "16/9" }}
      />

      {/* Loading overlay */}
      {loading && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60">
          <Loader2 className="w-10 h-10 text-cyan-400 animate-spin mb-3" />
          <span className="text-white/70 text-sm">Loading stream…</span>
        </div>
      )}

      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 gap-4">
          <AlertCircle className="w-12 h-12 text-red-400" />
          <p className="text-white text-sm text-center max-w-xs px-4">{error}</p>
          <button
            onClick={retry}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 text-white text-sm font-medium hover:bg-cyan-400 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      )}

      {/* Controls overlay */}
      <div
        className={cn(
          "absolute inset-0 flex flex-col justify-end transition-opacity duration-300 player-controls",
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        {/* Channel name */}
        {channelName && (
          <div className="absolute top-4 left-4">
            <span className="text-white font-semibold text-sm bg-black/40 backdrop-blur px-3 py-1.5 rounded-full">
              {channelName}
            </span>
          </div>
        )}

        {/* Control bar */}
        <div className="flex items-center gap-3 px-4 pb-4 pt-8">
          {/* Play/Pause */}
          <button
            id="player-play-pause"
            onClick={togglePlay}
            className="text-white hover:text-cyan-400 transition-colors p-1"
          >
            {playing ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
          </button>

          {/* Volume */}
          <button
            id="player-mute"
            onClick={toggleMute}
            className="text-white hover:text-cyan-400 transition-colors p-1"
          >
            {muted || volume === 0
              ? <VolumeX className="w-5 h-5" />
              : <Volume2 className="w-5 h-5" />
            }
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={muted ? 0 : volume}
            onChange={(e) => changeVolume(Number(e.target.value))}
            className="w-20 accent-cyan-400"
            aria-label="Volume"
          />

          <div className="flex-1" />

          {/* PiP */}
          {pipSupported && (
            <button
              id="player-pip"
              onClick={togglePiP}
              className="text-white hover:text-cyan-400 transition-colors p-1"
              title="Picture in Picture"
            >
              <PictureInPicture2 className="w-5 h-5" />
            </button>
          )}

          {/* Fullscreen */}
          <button
            id="player-fullscreen"
            onClick={toggleFullscreen}
            className="text-white hover:text-cyan-400 transition-colors p-1"
            title="Fullscreen"
          >
            <Maximize className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Click to play overlay when paused */}
      {!playing && !loading && !error && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center"
          aria-label="Play"
        >
          <div className="w-20 h-20 rounded-full bg-black/50 backdrop-blur flex items-center justify-center border border-white/20 hover:bg-black/70 transition-colors">
            <Play className="w-8 h-8 text-white fill-white ml-1" />
          </div>
        </button>
      )}
    </div>
  );
}

// Dynamically import to avoid SSR issues with HLS.js
const HLSPlayer = dynamic(() => Promise.resolve(HLSPlayerInner), { ssr: false });
export default HLSPlayer;
