"use client";

import Image from "next/image";
import Link from "next/link";
import { use } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Clock,
  MapPin,
  Users,
  Swords,
  Trophy,
} from "lucide-react";
import { useMatchDetail } from "@/hooks/useMatches";
import LivePulseBadge from "@/components/common/LivePulseBadge";
import { MatchCardSkeleton } from "@/components/common/LoadingSkeleton";
import {
  isMatchLive,
  getStatusLabel,
  formatMatchDate,
  formatMatchTime,
  cn,
  getCompetitionEmblem,
  getDhakaDateString,
  getDhakaNow,
} from "@/lib/utils";

interface Props {
  params: Promise<{ id: string }>;
}

function StatBar({ label, home, away, homeVal, awayVal }: {
  label: string;
  home: number;
  away: number;
  homeVal?: string;
  awayVal?: string;
}) {
  const total = home + away || 1;
  const homePct = Math.round((home / total) * 100);
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
      <div className="text-right">
        <span className="text-white font-semibold">{homeVal ?? home}</span>
      </div>
      <div className="text-center min-w-[100px]">
        <span className="text-gray-500 text-xs">{label}</span>
        <div className="flex h-1.5 rounded-full overflow-hidden mt-1.5 bg-white/10">
          <div
            className="bg-cyan-400 transition-all duration-1000"
            style={{ width: `${homePct}%` }}
          />
          <div
            className="bg-purple-400 flex-1 transition-all duration-1000"
          />
        </div>
      </div>
      <div>
        <span className="text-white font-semibold">{awayVal ?? away}</span>
      </div>
    </div>
  );
}

export default function MatchDetailPage({ params }: Props) {
  const { id } = use(params);
  const { match, isLoading } = useMatchDetail(id);

  // Helper to format Bangladesh start date/time nicely
  const getLocalStartText = (utcDateString: string) => {
    const date = new Date(utcDateString);
    if (isNaN(date.getTime())) return "Upcoming";
    
    const timeStr = date.toLocaleTimeString("en-US", {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: "Asia/Dhaka"
    });
    
    const dateStrDhaka = getDhakaDateString(date);
    const todayStrDhaka = getDhakaDateString(getDhakaNow());
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStrDhaka = getDhakaDateString(tomorrow);
    
    if (dateStrDhaka === todayStrDhaka) {
      return `Today, ${timeStr}`;
    } else if (dateStrDhaka === tomorrowStrDhaka) {
      return `Tomorrow, ${timeStr}`;
    } else {
      const dateStr = date.toLocaleDateString("en-GB", {
        day: '2-digit',
        month: 'short',
        timeZone: "Asia/Dhaka"
      });
      return `${dateStr}, ${timeStr}`;
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 pt-16 pb-32 space-y-4">
        <MatchCardSkeleton />
        <MatchCardSkeleton />
      </div>
    );
  }

  if (!match) {
    return (
      <div className="max-w-4xl mx-auto px-4 pt-16 text-center">
        <p className="text-gray-400">Match not found.</p>
        <Link href="/matches" className="text-cyan-400 mt-4 inline-block">← Back</Link>
      </div>
    );
  }

  const live = isMatchLive(match.status);
  const statusLabel = getStatusLabel(match.status, match.minute);
  
  // Only show score if the match has finished or is live
  const showScore = (match.status === "FINISHED" || match.status === "IN_PLAY" || match.status === "PAUSED") &&
    match.score?.fullTime?.home !== null &&
    match.score?.fullTime?.away !== null;
  const homeScore = match.score?.fullTime?.home;
  const awayScore = match.score?.fullTime?.away;
  const htHome   = match.score?.halfTime?.home;
  const htAway   = match.score?.halfTime?.away;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-32">
      {/* Back */}
      <Link
        href="/matches"
        className="inline-flex items-center gap-2 text-gray-500 hover:text-white text-sm mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Matches
      </Link>

      {/* Main scoreboard */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "glass rounded-3xl p-8 mb-6",
          live && "border-red-500/20 glow-live"
        )}
      >
        {/* Competition */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-8">
          <div className="flex items-center gap-2">
            {(match.competition.emblem || getCompetitionEmblem(match.competition.code)) && (
              <div className="w-6 h-6 flex items-center justify-center shrink-0">
                <img
                  src={match.competition.emblem || getCompetitionEmblem(match.competition.code)}
                  alt={match.competition.name}
                  className="w-full h-full object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              </div>
            )}
            <span className="text-gray-400 font-medium">
              {match.competition.name}
              {!live && (match.status === "SCHEDULED" || match.status === "TIMED") && (
                <span className="text-gray-500 text-sm ml-2 font-normal">
                  · {getLocalStartText(match.utcDate)}
                </span>
              )}
            </span>
          </div>
          {live ? (
            <LivePulseBadge label={statusLabel} size="md" />
          ) : (
            !(match.status === "SCHEDULED" || match.status === "TIMED") && (
              <span className="text-gray-500 text-sm">{statusLabel}</span>
            )
          )}
        </div>

        {/* Teams & Score */}
        <div className="grid grid-cols-3 items-center gap-4">
          {/* Home */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative w-20 h-20">
              {match.homeTeam.crest ? (
                <Image src={match.homeTeam.crest} alt={match.homeTeam.name} fill className="object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              ) : (
                <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center text-2xl font-bold text-white">
                  {match.homeTeam.tla}
                </div>
              )}
            </div>
            <h2 className="text-white font-bold text-lg text-center">
              {match.homeTeam.shortName || match.homeTeam.name}
            </h2>
          </div>

          {/* Score */}
          <div className="flex flex-col items-center gap-2">
            {showScore ? (
              <>
                <div className="flex items-center gap-3">
                  <span className={cn("text-6xl font-black", homeScore !== null && homeScore !== undefined && awayScore !== null && awayScore !== undefined && homeScore > awayScore ? "text-cyan-400" : "text-white")}>
                    {homeScore ?? 0}
                  </span>
                  <span className="text-gray-500 text-4xl">–</span>
                  <span className={cn("text-6xl font-black", homeScore !== null && homeScore !== undefined && awayScore !== null && awayScore !== undefined && awayScore > homeScore ? "text-cyan-400" : "text-white")}>
                    {awayScore ?? 0}
                  </span>
                </div>
                {htHome !== null && htAway !== null && (
                  <span className="text-gray-500 text-xs">HT: {htHome} – {htAway}</span>
                )}
              </>
            ) : (
              <div className="text-center">
                <span className="text-gray-500 font-extrabold text-xl uppercase tracking-wider bg-white/5 px-4 py-1.5 rounded-full border border-white/5 select-none">
                  vs
                </span>
              </div>
            )}
          </div>

          {/* Away */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative w-20 h-20">
              {match.awayTeam.crest ? (
                <Image src={match.awayTeam.crest} alt={match.awayTeam.name} fill className="object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              ) : (
                <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center text-2xl font-bold text-white">
                  {match.awayTeam.tla}
                </div>
              )}
            </div>
            <h2 className="text-white font-bold text-lg text-center">
              {match.awayTeam.shortName || match.awayTeam.name}
            </h2>
          </div>
        </div>

        {/* Meta */}
        <div className="flex items-center justify-center gap-6 mt-6 pt-6 border-t border-white/5 text-xs text-gray-500">
          {match.venue && (
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              {match.venue}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {formatMatchDate(match.utcDate)} · {formatMatchTime(match.utcDate)}
          </span>
          {match.attendance && (
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              {match.attendance.toLocaleString()}
            </span>
          )}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Goals timeline */}
        {match.goals && match.goals.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass rounded-2xl p-5"
          >
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Swords className="w-4 h-4 text-cyan-400" />
              Goals
            </h3>
            <div className="space-y-3">
              {match.goals.map((goal, i) => {
                const isHome = goal.team.id === match.homeTeam.id;
                return (
                  <div key={i} className={cn("flex items-center gap-3", !isHome && "flex-row-reverse")}>
                    <div className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                      goal.type === "OWN_GOAL" ? "bg-red-500/20 text-red-400 border border-red-500/30"
                        : goal.type === "PENALTY" ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                        : "bg-green-500/20 text-green-400 border border-green-500/30"
                    )}>
                      {goal.minute}&apos;
                    </div>
                    <div className={cn("flex-1", !isHome && "text-right")}>
                      <span className="text-white text-sm font-medium">{goal.scorer.name}</span>
                      {goal.type !== "REGULAR" && (
                        <span className="text-gray-500 text-xs ml-1">
                          ({goal.type === "OWN_GOAL" ? "OG" : "P"})
                        </span>
                      )}
                      {goal.assist && (
                        <div className="text-gray-500 text-xs">Assist: {goal.assist.name}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Bookings */}
        {match.bookings && match.bookings.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="glass rounded-2xl p-5"
          >
            <h3 className="text-white font-semibold mb-4">Cards</h3>
            <div className="space-y-2">
              {match.bookings.map((b, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className={cn(
                    "w-4 h-5 rounded-sm shrink-0",
                    b.card === "YELLOW_CARD" ? "bg-yellow-400"
                      : b.card === "RED_CARD" ? "bg-red-500"
                      : "bg-linear-to-b from-yellow-400 to-red-500"
                  )} />
                  <span className="text-white text-sm">{b.player.name}</span>
                  <span className="text-gray-500 text-xs">{b.minute}&apos;</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Lineups */}
        {(match.homeTeamLineup?.startXI || match.awayTeamLineup?.startXI) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="md:col-span-2 glass rounded-2xl p-5"
          >
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" />
              Lineups
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="text-cyan-400 text-sm font-medium mb-3">
                  {match.homeTeam.shortName}
                  {match.homeTeamLineup?.formation && <span className="text-gray-500 ml-2">({match.homeTeamLineup.formation})</span>}
                </h4>
                <div className="space-y-1">
                  {match.homeTeamLineup?.startXI?.map((p) => (
                    <div key={p.id} className="flex items-center gap-2 text-sm">
                      <span className="w-6 text-center text-gray-500 text-xs">{p.shirtNumber}</span>
                      <span className="text-white">{p.name}</span>
                      <span className="text-gray-600 text-xs">{p.position}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-purple-400 text-sm font-medium mb-3">
                  {match.awayTeam.shortName}
                  {match.awayTeamLineup?.formation && <span className="text-gray-500 ml-2">({match.awayTeamLineup.formation})</span>}
                </h4>
                <div className="space-y-1">
                  {match.awayTeamLineup?.startXI?.map((p) => (
                    <div key={p.id} className="flex items-center gap-2 text-sm">
                      <span className="w-6 text-center text-gray-500 text-xs">{p.shirtNumber}</span>
                      <span className="text-white">{p.name}</span>
                      <span className="text-gray-600 text-xs">{p.position}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Standings link */}
      <div className="mt-6 glass rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-yellow-400" />
          <span className="text-gray-400 text-sm">View {match.competition.name} standings</span>
        </div>
        <Link
          href="/standings"
          className="flex items-center gap-1 text-cyan-400 text-sm hover:text-cyan-300"
        >
          Full table →
        </Link>
      </div>
    </div>
  );
}
