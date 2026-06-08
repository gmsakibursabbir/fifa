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
  1: "bg-cyan-500",
  2: "bg-cyan-500",
  3: "bg-cyan-500",
  4: "bg-blue-500",
  5: "bg-orange-500",
};

export default function StandingsTable({ table, isLoading }: StandingsTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-1">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="h-12 skeleton-shimmer rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-gray-500 text-xs uppercase tracking-wider border-b border-white/5">
            <th className="text-left py-3 px-3 font-medium w-8">#</th>
            <th className="text-left py-3 px-3 font-medium">Team</th>
            <th className="text-center py-3 px-2 font-medium">P</th>
            <th className="text-center py-3 px-2 font-medium">W</th>
            <th className="text-center py-3 px-2 font-medium">D</th>
            <th className="text-center py-3 px-2 font-medium">L</th>
            <th className="text-center py-3 px-2 font-medium hidden sm:table-cell">GF</th>
            <th className="text-center py-3 px-2 font-medium hidden sm:table-cell">GA</th>
            <th className="text-center py-3 px-2 font-medium">GD</th>
            <th className="text-center py-3 px-2 font-medium">Pts</th>
            <th className="text-center py-3 px-2 font-medium hidden md:table-cell">Form</th>
          </tr>
        </thead>
        <tbody>
          {table.map((standing, idx) => (
            <motion.tr
              key={standing.team.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.03 }}
              className={cn(
                "border-b border-white/5 hover:bg-white/3 transition-colors group",
                standing.position <= 4 && "relative"
              )}
            >
              {/* Position */}
              <td className="py-3 px-3">
                <div className="flex items-center gap-1.5">
                  {ZONE_COLORS[standing.position] && (
                    <div
                      className={cn(
                        "w-1 h-5 rounded-full flex-shrink-0",
                        ZONE_COLORS[standing.position]
                      )}
                    />
                  )}
                  <span className="text-gray-400 font-medium w-4 text-center">
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
                    size={28}
                  />
                  <span className="text-white font-medium group-hover:text-cyan-400 transition-colors">
                    <span className="hidden sm:inline">{standing.team.name}</span>
                    <span className="sm:hidden">{standing.team.tla}</span>
                  </span>
                </div>
              </td>

              <td className="py-3 px-2 text-center text-gray-400">{standing.playedGames}</td>
              <td className="py-3 px-2 text-center text-gray-400">{standing.won}</td>
              <td className="py-3 px-2 text-center text-gray-400">{standing.draw}</td>
              <td className="py-3 px-2 text-center text-gray-400">{standing.lost}</td>
              <td className="py-3 px-2 text-center text-gray-500 hidden sm:table-cell">{standing.goalsFor}</td>
              <td className="py-3 px-2 text-center text-gray-500 hidden sm:table-cell">{standing.goalsAgainst}</td>
              <td className="py-3 px-2 text-center text-gray-400">
                {standing.goalDifference > 0 ? `+${standing.goalDifference}` : standing.goalDifference}
              </td>

              {/* Points */}
              <td className="py-3 px-2 text-center">
                <span className="font-bold text-white">{standing.points}</span>
              </td>

              {/* Form */}
              <td className="py-3 px-2 hidden md:table-cell">
                {standing.form && (
                  <div className="flex items-center justify-center gap-0.5">
                    {standing.form.split(",").slice(-5).map((r, i) => (
                      <span
                        key={i}
                        className={cn(
                          "w-5 h-5 rounded-sm text-[10px] font-bold flex items-center justify-center",
                          r === "W" && "bg-green-500/20 text-green-400",
                          r === "D" && "bg-gray-500/20 text-gray-400",
                          r === "L" && "bg-red-500/20 text-red-400",
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
      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/5 px-3">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-cyan-500" />
          <span className="text-xs text-gray-500">UCL Qualification</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-xs text-gray-500">UEL Qualification</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-500" />
          <span className="text-xs text-gray-500">Relegation Playoff</span>
        </div>
      </div>
    </div>
  );
}
