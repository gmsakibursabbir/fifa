"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Clock, MapPin } from "lucide-react";
import type { Match } from "@/types/football";
import {
  formatMatchTime,
  getStatusLabel,
  isMatchLive,
  cn,
  getCompetitionEmblem,
  getDhakaDateString,
} from "@/lib/utils";
import TeamCrest from "@/components/common/TeamCrest";
import { playClickSound, playHoverSound } from "@/lib/audio";

interface MatchCardProps {
  match: Match;
  index?: number;
  compact?: boolean;
}

function CountdownTimer({ utcDate }: { utcDate: string }) {
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    const target = new Date(utcDate).getTime();
    if (isNaN(target)) return;

    function update() {
      const now = new Date().getTime();
      const diff = target - now;
      if (diff <= 0) { setTimeLeft("Live shortly"); return; }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      if (days > 1)       setTimeLeft(`In ${days} days`);
      else if (days === 1) setTimeLeft(`In 1 day`);
      else {
        const hStr = hours.toString().padStart(2, "0");
        const mStr = minutes.toString().padStart(2, "0");
        const sStr = seconds.toString().padStart(2, "0");
        setTimeLeft(`${hStr}:${mStr}:${sStr}`);
      }
    }

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [utcDate]);

  return (
    <span className="text-[9px] font-cyber font-extrabold text-[#00f0ff] bg-[#00f0ff]/8 border border-[#00f0ff]/25 px-1.5 py-0.5 uppercase tracking-widest select-none">
      {timeLeft || "Upcoming"}
    </span>
  );
}

export default function MatchCard({ match, index = 0, compact = false }: MatchCardProps) {
  const live = isMatchLive(match.status);
  const isUpcoming = match.status === "TIMED" || match.status === "SCHEDULED";
  const statusLabel = getStatusLabel(match.status, match.minute);

  const showScore =
    (match.status === "FINISHED" || match.status === "IN_PLAY" || match.status === "PAUSED") &&
    match.score?.fullTime?.home !== null &&
    match.score?.fullTime?.away !== null;
  const homeScore = match.score?.fullTime?.home;
  const awayScore = match.score?.fullTime?.away;

  const getLocalStartText = (utcDateString: string) => {
    const date = new Date(utcDateString);
    if (isNaN(date.getTime())) return "Upcoming";
    const timeStr = date.toLocaleTimeString("en-US", {
      hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Dhaka",
    });
    const dateStrDhaka = getDhakaDateString(date);
    const todayStrDhaka = getDhakaDateString(new Date());
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStrDhaka = getDhakaDateString(tomorrow);
    if (dateStrDhaka === todayStrDhaka) return `Today, ${timeStr}`;
    if (dateStrDhaka === tomorrowStrDhaka) return `Tomorrow, ${timeStr}`;
    const dateStr = date.toLocaleDateString("en-GB", {
      day: "2-digit", month: "short", timeZone: "Asia/Dhaka",
    });
    return `${dateStr}, ${timeStr}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: [0.25, 0.8, 0.25, 1] }}
    >
      <Link
        href={`/matches/${match.id}`}
        id={`match-card-${match.id}`}
        onClick={() => { try { playClickSound(); } catch {} }}
        onMouseEnter={() => { try { playHoverSound(); } catch {} }}
        aria-label={`${match.homeTeam.name} vs ${match.awayTeam.name} — ${statusLabel}`}
        className="group block transition-all duration-300 hover:-translate-y-[3px]"
      >
        {/* Outer border wrapper */}
        <div
          className={cn(
            "p-[1px] transition-all duration-300",
            live
              ? "bg-[#ff0055]/35 shadow-[0_0_25px_rgba(255,0,85,0.08)]"
              : "bg-[#00f0ff]/18 group-hover:bg-[#fcee0a]/40 group-hover:shadow-[0_0_20px_rgba(252,238,10,0.08)]"
          )}
          style={{
            clipPath: "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))",
          }}
        >
          {/* Inner card content wrapper */}
          <div
            className="relative bg-[#09090d] p-5 w-full h-full overflow-hidden"
            style={{
              clipPath: "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))",
            }}
          >
            {/* Grid watermark */}
            <div
              className="absolute inset-0 pointer-events-none -z-10 opacity-30"
              style={{
                backgroundImage: "linear-gradient(rgba(0,240,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,240,255,0.04) 1px, transparent 1px)",
                backgroundSize: "20px 20px",
              }}
              aria-hidden="true"
            />

            {/* Corner accents */}
            <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 border-[#fcee0a] z-10" aria-hidden="true" />
            <div className="absolute bottom-0 right-0 w-5 h-[2px] bg-[#ff0055] z-10" aria-hidden="true" />

            {/* Live gradient glow overlay */}
            <div
              className={cn(
                "absolute inset-0 bg-gradient-to-br transition-all duration-300 pointer-events-none -z-10",
                live
                  ? "from-[#ff0055]/4 via-transparent to-transparent opacity-100"
                  : "from-[#00f0ff]/3 via-transparent to-transparent opacity-50 group-hover:opacity-100"
              )}
            />

            {/* Content Row */}
            <div className="flex items-center justify-between gap-3 relative z-10">
              {/* Competition tag */}
              <span className="text-[8px] font-cyber font-extrabold uppercase tracking-wider text-white/30 truncate max-w-[120px]">
                {match.competition?.name || "Match"}
              </span>

              {/* Status/Time badge */}
              <div className="flex items-center gap-1.5 shrink-0">
                {live && (
                  <span className="flex h-1.5 w-1.5 relative" aria-hidden="true">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff0055] opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#ff0055]" />
                  </span>
                )}
                <span
                  className={cn(
                    "text-[9px] font-cyber font-extrabold uppercase tracking-widest",
                    live ? "text-[#ff0055]" : "text-white/40"
                  )}
                >
                  {statusLabel}
                </span>
                {isUpcoming && <CountdownTimer utcDate={match.utcDate} />}
              </div>
            </div>

            {/* Teams & Score Row */}
            <div className="flex items-center justify-between gap-4 mt-5 relative z-10">
              {/* Home Team */}
              <div className="flex-1 flex items-center gap-2.5 min-w-0">
                <TeamCrest
                  crest={match.homeTeam.crest}
                  name={match.homeTeam.shortName || match.homeTeam.name}
                  tla={match.homeTeam.tla}
                  size={compact ? 24 : 28}
                />
                <span className="font-cyber font-bold text-xs sm:text-sm text-white/80 group-hover:text-[#fcee0a] transition-colors truncate">
                  {match.homeTeam.shortName || match.homeTeam.name}
                </span>
              </div>

              {/* Score Display */}
              <div className="flex items-center justify-center shrink-0 min-w-[70px]">
                {showScore ? (
                  <div
                    className={cn(
                      "flex items-center gap-2 px-3 py-1 bg-black/60 border font-cyber font-black text-sm tracking-widest text-[#fcee0a] select-none",
                      live ? "border-[#ff0055]/30" : "border-[#00f0ff]/20"
                    )}
                  >
                    <span>{homeScore}</span>
                    <span className="text-white/20 font-sans font-normal text-xs">-</span>
                    <span>{awayScore}</span>
                  </div>
                ) : (
                  <div className="text-[10px] font-cyber font-bold text-[#00f0ff] bg-[#00f0ff]/5 border border-[#00f0ff]/15 px-2.5 py-1 uppercase tracking-widest shrink-0 text-center">
                    {getLocalStartText(match.utcDate)}
                  </div>
                )}
              </div>

              {/* Away Team */}
              <div className="flex-1 flex items-center justify-end gap-2.5 min-w-0 text-right">
                <span className="font-cyber font-bold text-xs sm:text-sm text-white/80 group-hover:text-[#fcee0a] transition-colors truncate order-1">
                  {match.awayTeam.shortName || match.awayTeam.name}
                </span>
                <TeamCrest
                  crest={match.awayTeam.crest}
                  name={match.awayTeam.shortName || match.awayTeam.name}
                  tla={match.awayTeam.tla}
                  size={compact ? 24 : 28}
                />
              </div>
            </div>

            {/* Venue footer */}
            {!compact && match.venue && (
              <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-white/5 relative z-10">
                <MapPin className="w-3 h-3 text-white/25 shrink-0" aria-hidden="true" />
                <span className="text-[9px] text-white/25 uppercase tracking-wider font-mono truncate">
                  {match.venue}
                </span>
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
