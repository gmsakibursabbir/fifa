"use client";

import { useState } from "react";
import { Trophy } from "lucide-react";
import { useStandings } from "@/hooks/useStandings";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import ErrorState from "@/components/common/ErrorState";
import { motion } from "framer-motion";
import { cn, getTeamFlagUrl } from "@/lib/utils";

const GROUPS = ["Group A", "Group B", "Group C", "Group D", "Group E", "Group F", "Group G", "Group H", "Group I", "Group J", "Group K", "Group L"];

export default function WorldCupGroups() {
  const { standings, error, isLoading, mutate } = useStandings("WC");
  const [activeGroup, setActiveGroup] = useState("Group A");

  if (isLoading) {
    return (
      <section aria-labelledby="wc-groups-heading" className="py-6 border-b border-[#00f0ff]/8">
        <div className="flex items-center gap-3 mb-5 px-1">
          <div className="w-0.5 h-5 bg-[#fcee0a]" aria-hidden="true" />
          <Trophy className="w-4 h-4 text-[#fcee0a]/50" aria-hidden="true" />
          <h2 id="wc-groups-heading" className="font-cyber font-black text-base sm:text-lg uppercase tracking-widest text-white">
            Group Stage Standings
          </h2>
        </div>
        <div className="bg-[#09090d] border border-[#00f0ff]/12 p-6">
          <LoadingSkeleton variant="standing-row" count={4} />
        </div>
      </section>
    );
  }

  if (error || !standings) {
    return (
      <section aria-labelledby="wc-groups-heading" className="py-6 border-b border-[#00f0ff]/8">
        <div className="flex items-center gap-3 mb-5 px-1">
          <div className="w-0.5 h-5 bg-[#fcee0a]" aria-hidden="true" />
          <Trophy className="w-4 h-4 text-[#fcee0a]/50" aria-hidden="true" />
          <h2 id="wc-groups-heading" className="font-cyber font-black text-base sm:text-lg uppercase tracking-widest text-white">
            Group Stage Standings
          </h2>
        </div>
        <ErrorState message="Could not fetch World Cup groups" onRetry={() => mutate()} />
      </section>
    );
  }

  // Filter out the selected group's standings
  const activeTable = standings.standings.find((s) => s.group === activeGroup);

  return (
    <section aria-labelledby="wc-groups-heading" className="py-6 border-b border-[#00f0ff]/8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-5 px-1">
        <div className="flex items-center gap-3">
          <div className="w-0.5 h-5 bg-[#fcee0a]" aria-hidden="true" />
          <Trophy className="w-4 h-4 text-[#fcee0a]/50" aria-hidden="true" />
          <h2 id="wc-groups-heading" className="font-cyber font-black text-base sm:text-lg uppercase tracking-widest text-white">
            Group Stage Standings
          </h2>
        </div>

        {/* Group Selector Row */}
        <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-1.5 hide-scrollbar -mx-4 px-4 sm:-mx-8 sm:px-8 md:mx-0 md:px-0">
          {GROUPS.map((g) => (
            <button
              key={g}
              onClick={() => setActiveGroup(g)}
              className={cn(
                "px-3 py-1.5 text-[9px] font-cyber font-bold uppercase tracking-widest whitespace-nowrap border transition-all shrink-0",
                activeGroup === g
                  ? "bg-[#fcee0a] text-black border-[#fcee0a]"
                  : "bg-transparent border-[#00f0ff]/18 text-white/40 hover:text-[#00f0ff] hover:border-[#00f0ff]/40"
              )}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Standings Grid/Table Card */}
      {activeTable ? (
        <motion.div
          key={activeGroup}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="relative bg-[#09090d] border border-[#00f0ff]/18 overflow-hidden"
          style={{
            clipPath: "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))",
          }}
        >
          {/* Corner accents */}
          <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 border-[#fcee0a] z-10" aria-hidden="true" />
          <div className="absolute bottom-0 right-0 w-5 h-[2px] bg-[#ff0055] z-10" aria-hidden="true" />

          {/* Watermark grid */}
          <div
            className="absolute inset-0 pointer-events-none -z-10 opacity-30"
            style={{
              backgroundImage: "linear-gradient(rgba(0,240,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(0,240,255,0.02) 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
            aria-hidden="true"
          />

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#00f0ff]/18 text-[9.5px] sm:text-[10px] font-cyber font-black uppercase tracking-widest text-[#00f0ff]/60 bg-[#00f0ff]/3">
                  <th className="py-3 sm:py-4 px-3 sm:px-6 text-center w-10 sm:w-12 font-cyber">#</th>
                  <th className="py-3 sm:py-4 px-2 sm:px-4 font-cyber text-left">Team</th>
                  <th className="py-3 sm:py-4 px-2 sm:px-4 text-center font-cyber">P</th>
                  <th className="py-3 sm:py-4 px-2 sm:px-4 text-center hidden sm:table-cell font-cyber">W</th>
                  <th className="py-3 sm:py-4 px-2 sm:px-4 text-center hidden sm:table-cell font-cyber">D</th>
                  <th className="py-3 sm:py-4 px-2 sm:px-4 text-center hidden sm:table-cell font-cyber">L</th>
                  <th className="py-3 sm:py-4 px-2 sm:px-4 text-center font-cyber">GD</th>
                  <th className="py-3 sm:py-4 px-3 sm:px-6 text-right font-cyber text-[#00f0ff]">PTS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#00f0ff]/10 text-xs sm:text-sm">
                {activeTable.table.map((row) => {
                  const isQualifying = row.position <= 2; // Top 2 advance
                  return (
                    <tr
                      key={row.team.id}
                      className="hover:bg-[#00f0ff]/3 transition-colors group border-b border-[#00f0ff]/6"
                    >
                      <td className="py-3 sm:py-4 px-3 sm:px-6 text-center font-cyber font-bold relative">
                        {isQualifying && (
                          <div className="absolute left-0 top-1/4 bottom-1/4 w-0.5 sm:w-1 bg-[#fcee0a] shadow-[0_0_8px_rgba(252,238,10,0.5)]" />
                        )}
                        <span className={isQualifying ? "text-[#fcee0a] font-cyber text-xs sm:text-sm font-extrabold" : "text-white/30 font-mono text-xs sm:text-sm"}>
                          {row.position}
                        </span>
                      </td>
                      <td className="py-3 sm:py-4 px-2 sm:px-4 font-cyber font-bold text-white/80 group-hover:text-[#00f0ff] transition-colors">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-5 h-5 sm:w-6 sm:h-6 overflow-hidden bg-black border border-[#00f0ff]/20 flex items-center justify-center shrink-0 select-none">
                            {(() => {
                              const flagUrl = getTeamFlagUrl(row.team.tla, row.team.crest);
                              if (flagUrl) {
                                return (
                                  <img
                                    src={flagUrl}
                                    alt={row.team.name}
                                    width={24}
                                    height={24}
                                    className="object-contain w-full h-full"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = "none";
                                    }}
                                  />
                                );
                              }
                              return (
                                <div className="text-[7px] sm:text-[8px] text-white/50">{row.team.tla}</div>
                              );
                            })()}
                          </div>
                          <span className="tracking-wide text-xs sm:text-sm truncate max-w-[80px] sm:max-w-none">{row.team.name}</span>
                        </div>
                      </td>
                      <td className="py-3 sm:py-4 px-2 sm:px-4 text-center text-white/50 font-mono text-xs sm:text-sm">{row.playedGames}</td>
                      <td className="py-3 sm:py-4 px-2 sm:px-4 text-center text-white/40 font-mono text-xs sm:text-sm hidden sm:table-cell">{row.won}</td>
                      <td className="py-3 sm:py-4 px-2 sm:px-4 text-center text-white/40 font-mono text-xs sm:text-sm hidden sm:table-cell">{row.draw}</td>
                      <td className="py-3 sm:py-4 px-2 sm:px-4 text-center text-white/40 font-mono text-xs sm:text-sm hidden sm:table-cell">{row.lost}</td>
                      <td className="py-3 sm:py-4 px-2 sm:px-4 text-center font-mono text-white/60 text-xs sm:text-sm">
                        {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                      </td>
                      <td className="py-3 sm:py-4 px-3 sm:px-6 text-right font-cyber font-black text-[#00f0ff] text-sm sm:text-base">
                        {row.points}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="p-3 bg-[#00f0ff]/3 border-t border-[#00f0ff]/15 flex items-center gap-4 text-[9px] font-cyber font-bold text-white/30 uppercase tracking-widest">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-[#fcee0a] animate-pulse" />
              <span>Qualifies for Round of 32</span>
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="p-8 text-center text-white/30 border border-[#00f0ff]/18 relative bg-[#09090d]">
          <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#fcee0a]" />
          No standings available for this group.
        </div>
      )}
    </section>
  );
}
