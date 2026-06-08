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
} from "@/lib/utils";
import TeamCrest from "@/components/common/TeamCrest";

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

      if (diff <= 0) {
        setTimeLeft("Live shortly");
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (days > 1) {
        setTimeLeft(`In ${days} days`);
      } else if (days === 1) {
        setTimeLeft(`In 1 day`);
      } else {
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
    <span className="text-[9px] font-extrabold text-cyan-400 bg-cyan-400/10 border border-cyan-400/20 px-2 py-0.5 rounded-full uppercase tracking-wider select-none animate-pulse">
      {timeLeft || "Upcoming"}
    </span>
  );
}



export default function MatchCard({ match, index = 0, compact = false }: MatchCardProps) {
  const live = isMatchLive(match.status);
  const isUpcoming = match.status === "TIMED" || match.status === "SCHEDULED";
  const statusLabel = getStatusLabel(match.status, match.minute);
  
  // Don't show dummy scores for upcoming or live matches
  const showScore = match.status === "FINISHED" && match.score?.fullTime?.home !== null && match.score?.fullTime?.away !== null;
  const homeScore = match.score?.fullTime?.home;
  const awayScore = match.score?.fullTime?.away;

  // Helper to format local start date/time nicely
  const getLocalStartText = (utcDateString: string) => {
    const date = new Date(utcDateString);
    if (isNaN(date.getTime())) return "Upcoming";
    const now = new Date();
    
    const timeStr = date.toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit', hour12: true });
    const isToday = date.toDateString() === now.toDateString();
    const isTomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toDateString() === date.toDateString();
    
    if (isToday) {
      return `Today, ${timeStr}`;
    } else if (isTomorrow) {
      return `Tomorrow, ${timeStr}`;
    } else {
      const dateStr = date.toLocaleDateString([], { day: '2-digit', month: 'short' });
      return `${dateStr}, ${timeStr}`;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: [0.25, 0.8, 0.25, 1] }}
    >
      <Link href={`/matches/${match.id}`} id={`match-card-${match.id}`}>
        <div
          className={cn(
            "appletv-card bg-[#0d0d11] border border-white/5 rounded-2xl p-5 group relative overflow-hidden transition-all duration-300",
            live && "border-red-500/25 shadow-[0_0_20px_rgba(239,68,68,0.05)]"
          )}
        >
          {/* Pitch watermark lines */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-size-[24px_24px] pointer-events-none -z-20" />

          {/* Styled status backdrop glows */}
          <div className={cn(
            "absolute inset-0 bg-linear-to-br transition-all duration-300 opacity-[0.02] group-hover:opacity-[0.06] pointer-events-none -z-10",
            live ? "from-red-500 via-transparent to-transparent" : "from-cyan-500 via-transparent to-transparent"
          )} />

          {/* Subtle live indicator stripe at the top */}
          {live && (
            <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-red-500 to-pink-500 animate-pulse" />
          )}

          {/* Header */}
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="flex items-center gap-2">
              {(match.competition.emblem || getCompetitionEmblem(match.competition.code)) && (
                <div className="w-5 h-5 opacity-80 flex items-center justify-center shrink-0">
                  <img
                    src={match.competition.emblem || getCompetitionEmblem(match.competition.code)}
                    alt={match.competition.name}
                    className="w-full h-full object-contain"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                </div>
              )}
              <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider truncate max-w-[150px]">
                {match.competition.name}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {live ? (
                <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                  {statusLabel}
                </span>
              ) : isUpcoming ? (
                <CountdownTimer utcDate={match.utcDate} />
              ) : (
                <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded-full">
                  {statusLabel}
                </span>
              )}
            </div>
          </div>

          {/* Teams & Score */}
          <div className="flex items-center gap-2 sm:gap-3 py-1 relative z-10">
            {/* Home team */}
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <TeamCrest
                crest={match.homeTeam.crest}
                name={match.homeTeam.shortName || match.homeTeam.name}
                tla={match.homeTeam.tla}
                size={compact ? 26 : 30}
              />
              <span className="text-white font-semibold text-xs sm:text-sm tracking-wide truncate group-hover:text-white transition-colors">
                <span className="sm:hidden">
                  {match.homeTeam.tla || (match.homeTeam.shortName || match.homeTeam.name).slice(0, 3).toUpperCase()}
                </span>
                <span className="hidden sm:inline">
                  {match.homeTeam.shortName || match.homeTeam.name}
                </span>
              </span>
            </div>

            {/* Score / Time */}
            <div className="shrink-0 text-center mx-1">
              {showScore ? (
                <div className="flex items-center gap-1.5 sm:gap-2 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg font-bold text-base sm:text-lg bg-white/5 border border-white/5 shadow-inner">
                  <span className={cn(homeScore !== null && homeScore !== undefined && awayScore !== null && awayScore !== undefined && homeScore > awayScore ? "text-white" : "text-white/40")}>
                    {homeScore}
                  </span>
                  <span className="text-white/20 text-xs sm:text-sm font-normal">–</span>
                  <span className={cn(homeScore !== null && homeScore !== undefined && awayScore !== null && awayScore !== undefined && awayScore > homeScore ? "text-white" : "text-white/40")}>
                    {awayScore}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1 sm:gap-1.5 text-cyan-400 font-extrabold text-[9px] sm:text-[11px] uppercase tracking-wider bg-cyan-400/10 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-full border border-cyan-400/20 select-none animate-pulse">
                  <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-cyan-400" />
                  <span>{getLocalStartText(match.utcDate)}</span>
                </div>
              )}
            </div>

            {/* Away team */}
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 justify-end">
              <span className="text-white font-semibold text-xs sm:text-sm tracking-wide truncate text-right group-hover:text-white transition-colors">
                <span className="sm:hidden">
                  {match.awayTeam.tla || (match.awayTeam.shortName || match.awayTeam.name).slice(0, 3).toUpperCase()}
                </span>
                <span className="hidden sm:inline">
                  {match.awayTeam.shortName || match.awayTeam.name}
                </span>
              </span>
              <TeamCrest
                crest={match.awayTeam.crest}
                name={match.awayTeam.shortName || match.awayTeam.name}
                tla={match.awayTeam.tla}
                size={compact ? 26 : 30}
              />
            </div>
          </div>

          {/* Footer */}
          {!compact && match.venue && (
            <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-white/5 relative z-10">
              <MapPin className="w-3 h-3 text-white/30" />
              <span className="text-[10px] text-white/30 uppercase tracking-wider font-semibold truncate">
                {match.venue}
              </span>
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
