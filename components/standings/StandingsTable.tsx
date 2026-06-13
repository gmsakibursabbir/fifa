"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import type { Standing } from "@/types/football";
import { cn } from "@/lib/utils";
import TeamCrest from "@/components/common/TeamCrest";

interface StandingsTableProps {
  table: Standing[];
  isLoading?: boolean;
}

const ZONE_COLORS: Record<number, string> = {
  1: "bg-[#00f0ff] shadow-[0_0_6px_#00f0ff]",
  2: "bg-[#00f0ff] shadow-[0_0_6px_#00f0ff]",
  3: "bg-[#00f0ff] shadow-[0_0_6px_#00f0ff]",
  4: "bg-[#00f0ff] shadow-[0_0_6px_#00f0ff]",
  5: "bg-[#fcee0a] shadow-[0_0_6px_#fcee0a]",
  6: "bg-[#fcee0a] shadow-[0_0_6px_#fcee0a]",
  18: "bg-[#ff0055] shadow-[0_0_6px_#ff0055]",
  19: "bg-[#ff0055] shadow-[0_0_6px_#ff0055]",
  20: "bg-[#ff0055] shadow-[0_0_6px_#ff0055]",
};

export default function StandingsTable({ table, isLoading }: StandingsTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-1.5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="h-12 skeleton-shimmer bg-[#09090d] border border-[#00f0ff]/10" />
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs sm:text-sm border-collapse">
        <thead>
          <tr className="border-b border-[#00f0ff]/18 text-[9.5px] sm:text-[10px] font-cyber font-black uppercase tracking-widest text-[#00f0ff]/60 bg-[#00f0ff]/3">
            <th className="text-center py-3 px-3 font-cyber w-10 sm:w-12">#</th>
            <th className="text-left py-3 px-3 font-cyber">Team</th>
            <th className="text-center py-3 px-2 font-cyber">P</th>
            <th className="text-center py-3 px-2 font-cyber">W</th>
            <th className="text-center py-3 px-2 font-cyber">D</th>
            <th className="text-center py-3 px-2 font-cyber">L</th>
            <th className="text-center py-3 px-2 font-cyber hidden sm:table-cell font-cyber">GF</th>
            <th className="text-center py-3 px-2 font-cyber hidden sm:table-cell font-cyber">GA</th>
            <th className="text-center py-3 px-2 font-cyber">GD</th>
            <th className="text-center py-3 px-2 font-cyber text-[#00f0ff]">PTS</th>
            <th className="text-center py-3 px-2 font-cyber hidden md:table-cell">Form</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#00f0ff]/10">
          {table.map((standing, idx) => (
            <motion.tr
              key={standing.team.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.03 }}
              className="hover:bg-[#00f0ff]/3 transition-colors group border-b border-[#00f0ff]/6"
            >
              {/* Position */}
              <td className="py-3 px-3">
                <div className="flex items-center gap-2">
                  {ZONE_COLORS[standing.position] ? (
                    <div
                      className={cn(
                        "w-1 h-5 flex-shrink-0",
                        ZONE_COLORS[standing.position]
                      )}
                    />
                  ) : (
                    <div className="w-1 h-5 flex-shrink-0 bg-transparent" />
                  )}
                  <span className={cn(
                    "font-cyber text-center w-5 font-bold",
                    ZONE_COLORS[standing.position] ? "text-[#00f0ff] font-extrabold" : "text-white/30 font-mono"
                  )}>
                    {standing.position}
                  </span>
                </div>
              </td>

              {/* Team */}
              <td className="py-3 px-3">
                <div className="flex items-center gap-3">
                  <TeamCrest
                    tla={standing.team.tla}
                    crest={standing.team.crest}
                    name={standing.team.name}
                    size={24}
                    className="rounded-none border-[#00f0ff]/20 bg-black"
                  />
                  <span className="font-cyber font-bold text-white/85 group-hover:text-[#00f0ff] transition-colors">
                    <span className="hidden sm:inline">{standing.team.name}</span>
                    <span className="sm:hidden">{standing.team.tla}</span>
                  </span>
                </div>
              </td>

              <td className="py-3 px-2 text-center text-white/50 font-mono">{standing.playedGames}</td>
              <td className="py-3 px-2 text-center text-white/40 font-mono">{standing.won}</td>
              <td className="py-3 px-2 text-center text-white/40 font-mono">{standing.draw}</td>
              <td className="py-3 px-2 text-center text-white/40 font-mono">{standing.lost}</td>
              <td className="py-3 px-2 text-center text-white/30 font-mono hidden sm:table-cell">{standing.goalsFor}</td>
              <td className="py-3 px-2 text-center text-white/30 font-mono hidden sm:table-cell">{standing.goalsAgainst}</td>
              <td className="py-3 px-2 text-center font-mono text-white/60">
                {standing.goalDifference > 0 ? `+${standing.goalDifference}` : standing.goalDifference}
              </td>

              {/* Points */}
              <td className="py-3 px-2 text-center">
                <span className="font-cyber font-black text-[#00f0ff] text-sm sm:text-base">{standing.points}</span>
              </td>

              {/* Form */}
              <td className="py-3 px-2 hidden md:table-cell">
                {standing.form && (
                  <div className="flex items-center justify-center gap-1">
                    {standing.form.split(",").slice(-5).map((r, i) => (
                      <span
                        key={i}
                        className={cn(
                          "w-5 h-5 text-[9px] font-cyber font-black flex items-center justify-center border",
                          r === "W" && "bg-[#39ff14]/10 text-[#39ff14] border-[#39ff14]/30",
                          r === "D" && "bg-white/5 text-white/40 border-white/10",
                          r === "L" && "bg-[#ff0055]/10 text-[#ff0055] border-[#ff0055]/30",
                        )}
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                )}
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-6 mt-4 pt-4 border-t border-[#00f0ff]/15 px-3 text-[9px] font-cyber font-bold text-white/40 uppercase tracking-widest">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-[#00f0ff] shadow-[0_0_6px_#00f0ff]" />
          <span>UCL Qualification</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-[#fcee0a] shadow-[0_0_6px_#fcee0a]" />
          <span>UEL Qualification</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-[#ff0055] shadow-[0_0_6px_#ff0055]" />
          <span>Relegation</span>
        </div>
      </div>
    </div>
  );
}
