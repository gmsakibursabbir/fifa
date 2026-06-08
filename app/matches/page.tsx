"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { RefreshCw, Activity } from "lucide-react";
import MatchCard from "@/components/matches/MatchCard";
import MatchFilter from "@/components/matches/MatchFilter";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import { useMatches } from "@/hooks/useMatches";
import type { FilterStatus } from "@/types/football";

export default function MatchesPage() {
  const [filter, setFilter] = useState<FilterStatus>("TODAY");
  const { matches, isLoading, isError, refresh } = useMatches(filter);

  const grouped = matches.reduce<Record<string, typeof matches>>((acc, m) => {
    const key = m.competition.name;
    if (!acc[key]) acc[key] = [];
    acc[key].push(m);
    return acc;
  }, {});

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 md:px-16 pt-14 pb-28">
      {/* Header */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
        <div>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 mb-2"
          >
            <Activity className="w-6 h-6 text-cyan-400" />
            <h1 className="text-xl sm:text-3xl font-bold text-white uppercase tracking-wider font-sans">
              Match Center
            </h1>
          </motion.div>
          <p className="text-white/40 text-sm font-medium">
            Real-time live scores, match status, and upcoming fixtures from major leagues.
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 flex-wrap">
          <MatchFilter
            value={filter}
            onChange={setFilter}
            counts={{
              LIVE: matches.filter((m) => m.status === "IN_PLAY" || m.status === "PAUSED").length || undefined,
            }}
          />
          <button
            id="refresh-matches"
            onClick={() => refresh()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 border border-white/5 text-white/70 hover:text-white hover:bg-white/10 hover:border-white/10 text-xs font-bold uppercase tracking-wider transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <LoadingSkeleton count={6} variant="match-card" />
      ) : isError ? (
        <div className="glass rounded-2xl p-8 text-center border border-white/5">
          <p className="text-gray-400 mb-4 font-semibold">Failed to load matches. Using demo data.</p>
        </div>
      ) : matches.length === 0 ? (
        <div className="bg-[#0c0c0e] border border-white/5 rounded-2xl p-16 text-center">
          <Activity className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <h3 className="text-white font-semibold text-lg mb-1">No matches found</h3>
          <p className="text-white/40 text-sm">
            {filter === "LIVE"
              ? "No matches are live right now. Check back soon!"
              : `No ${filter.toLowerCase()} matches scheduled.`}
          </p>
        </div>
      ) : (
        <div className="space-y-12">
          {Object.entries(grouped).map(([competition, compMatches]) => (
            <motion.div
              key={competition}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              {/* Competition header */}
              <div className="flex items-center gap-3">
                <span className="text-white text-xs font-bold uppercase tracking-widest px-4 py-1.5 bg-white/5 border border-white/5 rounded-full">
                  {competition}
                </span>
                <div className="h-px flex-1 bg-white/5" />
              </div>

              {/* Responsive Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {compMatches.map((match, i) => (
                  <MatchCard key={match.id} match={match} index={i} />
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Auto-refresh notice */}
      <div className="mt-16 flex justify-center">
        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 border border-white/5 text-[10px] font-bold uppercase tracking-widest text-white/50 select-none">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>
            {filter === "LIVE" || filter === "TODAY"
              ? "⚡ Live Auto-refreshing every 10s"
              : "🔄 Auto-refreshing every 30s"}
          </span>
        </div>
      </div>
    </div>
  );
}
