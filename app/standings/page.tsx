"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Trophy, ChevronDown } from "lucide-react";
import StandingsTable from "@/components/standings/StandingsTable";
import { useStandings } from "@/hooks/useStandings";
import { COMPETITIONS } from "@/types/football";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import { cn, getCompetitionEmblem } from "@/lib/utils";
import TeamCrest from "@/components/common/TeamCrest";

const COMPS = COMPETITIONS.map((c) => c);

export default function StandingsPage() {
  const [selected, setSelected] = useState("WC"); // Default to WC (World Cup 2026)
  const [open, setOpen] = useState(false);
  const { standings, isLoading } = useStandings(selected);

  const currentComp = COMPS.find((c) => c.code === selected);

  return (
    <div className="max-w-6xl mx-auto px-6 sm:px-8 pt-16 pb-32">
      {/* Header */}
      <div className="mb-10">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-2"
        >
          <Trophy className="w-6 h-6 text-white" />
          <h1 className="text-3xl font-extrabold text-white tracking-wider uppercase font-sans">Standings</h1>
        </motion.div>
        <p className="text-white/40 ml-9 text-sm font-medium">Track qualified teams and group stages from top tournaments.</p>
      </div>

      {/* Competition selector */}
      <div className="relative mb-8 w-fit" id="competition-selector">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-3 px-5 py-2.5 bg-white/5 border border-white/5 rounded-full text-white text-xs font-bold uppercase tracking-wider hover:bg-white/10 transition-all active:scale-95"
        >
          {currentComp && (
            <div className="w-5 h-5 shrink-0 flex items-center justify-center">
              <img
                src={getCompetitionEmblem(currentComp.code)}
                alt={currentComp.name}
                className="w-full h-full object-contain"
              />
            </div>
          )}
          <span>{currentComp?.name}</span>
          <ChevronDown className={`w-4 h-4 text-white/50 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>

        {open && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-full mt-2 left-0 bg-[#0c0c0e] border border-white/5 rounded-2xl overflow-hidden z-20 min-w-[240px] shadow-2xl max-h-[350px] overflow-y-auto"
          >
            {COMPS.map((comp) => (
              <button
                key={comp.code}
                id={`comp-${comp.code}`}
                onClick={() => { setSelected(comp.code); setOpen(false); }}
                className={cn(
                  "flex items-center gap-3 w-full px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-left transition-colors border-b border-white/2",
                  selected === comp.code
                    ? "bg-white text-black"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                )}
              >
                <div className="w-5 h-5 shrink-0 flex items-center justify-center">
                  <img
                    src={getCompetitionEmblem(comp.code)}
                    alt={comp.name}
                    className="w-full h-full object-contain"
                  />
                </div>
                <span>{comp.name}</span>
              </button>
            ))}
          </motion.div>
        )}
      </div>

      {/* Main Table Content */}
      <motion.div
        key={selected}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {isLoading ? (
          <div className="bg-[#0c0c0e] border border-white/5 rounded-2xl p-6">
            <LoadingSkeleton variant="standing-row" count={8} />
          </div>
        ) : selected === "WC" && standings ? (
          /* World Cup 2026 - Render 12 Groups grid */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {standings.standings.map((groupTable) => (
              <div
                key={groupTable.group}
                className="bg-[#0c0c0e] border border-white/5 rounded-2xl p-6 flex flex-col"
              >
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 pb-2 border-b border-white/5">
                  {groupTable.group}
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="text-[10px] font-bold text-white/40 uppercase tracking-widest border-b border-white/5">
                        <th className="py-2 text-center w-8">#</th>
                        <th className="py-2">Team</th>
                        <th className="py-2 text-center w-8">P</th>
                        <th className="py-2 text-center w-8">GD</th>
                        <th className="py-2 text-right w-10">PTS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-sans">
                      {groupTable.table.map((row) => {
                        const advanced = row.position <= 2;
                        return (
                          <tr key={row.team.id} className="hover:bg-white/1">
                            <td className="py-3 text-center font-bold text-white/50">{row.position}</td>
                            <td className="py-3">
                              <div className="flex items-center gap-2">
                                  <TeamCrest
                                    tla={row.team.tla}
                                    crest={row.team.crest}
                                    name={row.team.name}
                                    size={20}
                                  />
                                <span className={cn("font-medium", advanced ? "text-white" : "text-white/60")}>
                                  {row.team.name}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 text-center text-white/50">{row.playedGames}</td>
                            <td className="py-3 text-center text-white/50">
                              {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                            </td>
                            <td className="py-3 text-right font-extrabold text-white">{row.points}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        ) : standings ? (
          /* Standard League Table display */
          <div className="bg-[#0c0c0e] border border-white/5 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/5">
              <span className="text-white/40 text-xs font-bold uppercase tracking-widest">
                {standings.competition.name}
              </span>
              {standings.season.currentMatchday && (
                <span className="text-white text-xs font-bold uppercase tracking-widest">
                  Matchday {standings.season.currentMatchday}
                </span>
              )}
            </div>
            <StandingsTable table={standings.standings[0]?.table || []} />
          </div>
        ) : (
          <div className="bg-[#0c0c0e] border border-white/5 rounded-2xl p-12 text-center text-white/40">
            No standings available.
          </div>
        )}
      </motion.div>
    </div>
  );
}
