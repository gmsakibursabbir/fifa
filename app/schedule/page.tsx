"use client";

import { useState, useMemo, useEffect } from "react";
import useSWR from "swr";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar as CalendarIcon, Activity, ChevronRight, AlertCircle, ArrowRight } from "lucide-react";
import MatchCard from "@/components/matches/MatchCard";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import type { Match } from "@/types/football";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch matches: ${res.status}`);
  }
  return res.json() as Promise<Match[]>;
};

export default function SchedulePage() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Fetch all matches (live, scheduled, finished) to distribute into calendar days
  const { data: matches = [], error, isLoading } = useSWR<Match[]>(
    "/api/football?action=status&status=SCHEDULED,TIMED,IN_PLAY,PAUSED,FINISHED",
    fetcher,
    {
      refreshInterval: 20000, // Refresh every 20s
      revalidateOnFocus: true,
    }
  );

  // Generate a list of 10 consecutive days starting from today (June 8, 2026)
  const calendarDates = useMemo(() => {
    const list: Date[] = [];
    const base = new Date();
    for (let i = 0; i < 10; i++) {
      const d = new Date(base.getTime());
      d.setDate(base.getDate() + i);
      list.push(d);
    }
    return list;
  }, []);

  // Set initial selected date to today when component mounts
  useEffect(() => {
    if (calendarDates.length > 0 && !selectedDate) {
      setSelectedDate(calendarDates[0]);
    }
  }, [calendarDates, selectedDate]);

  // Map matches to their local calendar dates
  const matchesByDateStr = useMemo(() => {
    const map: Record<string, Match[]> = {};
    matches.forEach((m) => {
      const dateStr = new Date(m.utcDate).toDateString();
      if (!map[dateStr]) map[dateStr] = [];
      map[dateStr].push(m);
    });
    return map;
  }, [matches]);

  // Filter matches for the selected date
  const filteredMatches = useMemo(() => {
    if (!selectedDate) return [];
    const key = selectedDate.toDateString();
    return matchesByDateStr[key] || [];
  }, [selectedDate, matchesByDateStr]);

  // Group filtered matches by competition
  const groupedMatches = useMemo(() => {
    return filteredMatches.reduce<Record<string, Match[]>>((acc, m) => {
      const compName = m.competition.name;
      if (!acc[compName]) acc[compName] = [];
      acc[compName].push(m);
      return acc;
    }, {});
  }, [filteredMatches]);

  // Find the first upcoming date with matches relative to the selected date
  const nextMatchDate = useMemo(() => {
    if (!selectedDate) return undefined;
    // Set hours to 0 to compare dates accurately
    const selectedTime = new Date(selectedDate.getTime());
    selectedTime.setHours(0, 0, 0, 0);

    return calendarDates.find((date) => {
      const dateTime = new Date(date.getTime());
      dateTime.setHours(0, 0, 0, 0);
      if (dateTime.getTime() <= selectedTime.getTime()) return false;

      const count = matchesByDateStr[date.toDateString()]?.length || 0;
      return count > 0;
    });
  }, [calendarDates, selectedDate, matchesByDateStr]);

  if (!selectedDate) {
    return (
      <div className="max-w-[1600px] mx-auto px-8 md:px-16 pt-16 pb-32 min-h-screen">
        <LoadingSkeleton count={3} variant="match-card" />
      </div>
    );
  }

  const selectedDateStr = selectedDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="max-w-[1600px] mx-auto px-8 md:px-16 pt-16 pb-32 min-h-screen">
      {/* Page Header */}
      <div className="mb-10 border-b border-white/5 pb-8">
        <div className="flex items-center gap-3 mb-2">
          <CalendarIcon className="w-6 h-6 text-cyan-400" />
          <h1 className="text-3xl font-bold text-white uppercase tracking-wider font-sans">
            Match Calendar
          </h1>
        </div>
        <p className="text-white/40 text-sm font-medium">
          Browse fixtures, kick-off times, and live scores by selecting a date.
        </p>
      </div>

      {/* Horizontal Calendar Date Bar */}
      <div className="mb-12">
        <div className="flex gap-4 overflow-x-auto pb-4 px-2 -mx-2 hide-scrollbar">
          {calendarDates.map((date) => {
            const isSelected = date.toDateString() === selectedDate.toDateString();
            const dateMatches = matchesByDateStr[date.toDateString()] || [];
            const count = dateMatches.length;
            const hasLive = dateMatches.some((m) => m.status === "IN_PLAY" || m.status === "PAUSED");

            const dayName = date.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
            const dayNum = date.toLocaleDateString("en-US", { day: "2-digit" });
            const monthName = date.toLocaleDateString("en-US", { month: "short" }).toUpperCase();

            return (
              <button
                key={date.toISOString()}
                onClick={() => setSelectedDate(date)}
                className={`relative shrink-0 w-24 rounded-2xl pt-4 px-3 pb-6 transition-all duration-300 select-none group border ${
                  isSelected
                    ? "bg-white border-white text-black shadow-lg shadow-white/5 scale-[1.03]"
                    : "bg-white/5 border-white/5 text-white hover:bg-white/10 hover:border-white/10"
                }`}
              >
                <div className="text-[10px] font-bold uppercase tracking-wider opacity-60 text-center mb-1">
                  {dayName}
                </div>
                <div className="text-2xl font-extrabold text-center tracking-tight leading-none mb-1 font-sans">
                  {dayNum}
                </div>
                <div className="text-[9px] font-bold text-center tracking-widest opacity-60">
                  {monthName}
                </div>

                {/* Match Indicators */}
                {count > 0 && (
                  <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
                    {hasLive ? (
                      <span className="flex h-1.5 w-1.5 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                      </span>
                    ) : (
                      <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/50" />
                    )}
                    <span
                      className={`text-[8px] font-extrabold px-1 rounded-sm tracking-tighter ${
                        isSelected ? "bg-black/5 text-black/60" : "bg-white/5 text-white/40"
                      }`}
                    >
                      {count}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Date Header */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold text-white tracking-wide">
          {selectedDateStr}
        </h2>
        {filteredMatches.length > 0 && (
          <span className="text-[10px] font-extrabold text-white/40 bg-white/5 border border-white/5 px-3 py-1 rounded-full uppercase tracking-wider">
            {filteredMatches.length} {filteredMatches.length === 1 ? "Fixture" : "Fixtures"}
          </span>
        )}
      </div>

      {/* Fixtures Content */}
      {isLoading ? (
        <LoadingSkeleton count={4} variant="match-card" />
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 text-center flex flex-col items-center">
          <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
          <p className="text-red-200 font-semibold text-sm">Failed to load match schedule</p>
          <p className="text-red-300/60 text-xs mt-1">Please try refreshing the page</p>
        </div>
      ) : filteredMatches.length === 0 ? (
        <div className="bg-[#0c0c0e]/80 border border-white/5 rounded-2xl p-16 text-center shadow-inner relative overflow-hidden">
          <div className="absolute inset-0 bg-linear-to-b from-transparent to-black/20 pointer-events-none" />
          <div className="relative z-10 max-w-md mx-auto">
            <CalendarIcon className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <h3 className="text-white font-semibold text-lg mb-1">No Matches Scheduled</h3>
            <p className="text-white/40 text-sm mb-6">
              There are no live or upcoming fixtures scheduled for this date.
            </p>

            {nextMatchDate && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedDate(nextMatchDate)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-black text-xs font-bold uppercase tracking-wider hover:bg-white/95 transition-all shadow-md"
              >
                Go to Next Matchday ({nextMatchDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })})
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-12">
          {Object.entries(groupedMatches).map(([competition, compMatches]) => (
            <div key={competition} className="space-y-4">
              {/* Competition header */}
              <div className="flex items-center gap-3">
                <span className="text-white text-xs font-bold uppercase tracking-widest px-4 py-1.5 bg-white/5 border border-white/5 rounded-full select-none">
                  {competition}
                </span>
                <div className="h-px flex-1 bg-white/5" />
              </div>

              {/* Match Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {compMatches.map((match, i) => (
                  <MatchCard key={match.id} match={match} index={i} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
