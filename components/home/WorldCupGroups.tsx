"use client";

import { useState } from "react";
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
      <div className="py-8">
        <h2 className="text-xl font-bold uppercase tracking-wider text-white mb-6">FIFA World Cup 2026 Standings</h2>
        <LoadingSkeleton variant="standing-row" count={4} />
      </div>
    );
  }

  if (error || !standings) {
    return (
      <div className="py-8">
        <ErrorState message="Could not fetch World Cup groups" onRetry={() => mutate()} />
      </div>
    );
  }

  // Filter out the selected group's standings
  const activeTable = standings.standings.find((s) => s.group === activeGroup);

  return (
    <div className="py-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-1">
            USA / MEXICO / CANADA 2026
          </span>
          <h2 className="text-2xl font-bold uppercase tracking-wider text-white font-sans">
            Group Stage Standings
          </h2>
        </div>

        {/* Group Selector Row */}
        <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-2 hide-scrollbar -mx-4 px-4 sm:-mx-6 sm:px-6 md:mx-0 md:px-0">
          {GROUPS.map((g) => (
            <button
              key={g}
              onClick={() => setActiveGroup(g)}
              className={cn(
                "px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all duration-200 shrink-0 border",
                activeGroup === g
                  ? "bg-white text-black border-white"
                  : "bg-white/5 text-white/50 border-white/5 hover:text-white hover:bg-white/10"
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
          className="bg-[#0c0c0e] border border-white/5 rounded-2xl overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-white/40 bg-white/1">
                  <th className="py-3 sm:py-4 px-3 sm:px-6 text-center w-10 sm:w-12">#</th>
                  <th className="py-3 sm:py-4 px-2 sm:px-4">Team</th>
                  <th className="py-3 sm:py-4 px-2 sm:px-4 text-center">P</th>
                  <th className="py-3 sm:py-4 px-2 sm:px-4 text-center hidden sm:table-cell">W</th>
                  <th className="py-3 sm:py-4 px-2 sm:px-4 text-center hidden sm:table-cell">D</th>
                  <th className="py-3 sm:py-4 px-2 sm:px-4 text-center hidden sm:table-cell">L</th>
                  <th className="py-3 sm:py-4 px-2 sm:px-4 text-center">GD</th>
                  <th className="py-3 sm:py-4 px-3 sm:px-6 text-right font-bold text-white">PTS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {activeTable.table.map((row) => {
                  const isQualifying = row.position <= 2; // Top 2 advance
                  return (
                    <tr
                      key={row.team.id}
                      className="hover:bg-white/2 transition-colors group"
                    >
                      <td className="py-3 sm:py-4 px-3 sm:px-6 text-center font-bold relative">
                        {isQualifying && (
                          <div className="absolute left-0 top-1/4 bottom-1/4 w-0.5 sm:w-1 bg-white" />
                        )}
                        <span className={isQualifying ? "text-white text-xs sm:text-sm" : "text-white/40 text-xs sm:text-sm"}>
                          {row.position}
                        </span>
                      </td>
                      <td className="py-3 sm:py-4 px-2 sm:px-4 font-semibold text-white">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center shrink-0 select-none">
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
                      <td className="py-3 sm:py-4 px-2 sm:px-4 text-center text-white/60 text-xs sm:text-sm">{row.playedGames}</td>
                      <td className="py-3 sm:py-4 px-2 sm:px-4 text-center text-white/60 text-xs sm:text-sm hidden sm:table-cell">{row.won}</td>
                      <td className="py-3 sm:py-4 px-2 sm:px-4 text-center text-white/60 text-xs sm:text-sm hidden sm:table-cell">{row.draw}</td>
                      <td className="py-3 sm:py-4 px-2 sm:px-4 text-center text-white/60 text-xs sm:text-sm hidden sm:table-cell">{row.lost}</td>
                      <td className="py-3 sm:py-4 px-2 sm:px-4 text-center font-semibold text-white/70 text-xs sm:text-sm">
                        {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                      </td>
                      <td className="py-3 sm:py-4 px-3 sm:px-6 text-right font-bold text-white text-sm sm:text-base">
                        {row.points}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="p-4 bg-white/1 border-t border-white/5 flex items-center gap-4 text-[10px] text-white/30 font-bold uppercase tracking-widest">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-white rounded-full" />
              <span>Qualifies for Round of 32</span>
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="p-8 text-center text-white/30 border border-white/5 rounded-2xl">
          No standings available for this group.
        </div>
      )}
    </div>
  );
}
