"use client";

import { useState } from "react";
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
    <div className="max-w-[1600px] mx-auto px-4 sm:px-8 md:px-16 pt-14 pb-28">
      {/* Header */}
      <div className="mb-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-2 px-1"
        >
          <div className="w-0.5 h-6 bg-[#fcee0a]" aria-hidden="true" />
          <Trophy className="w-5 h-5 text-[#fcee0a]/50" aria-hidden="true" />
          <h1 className="font-cyber font-black text-xl sm:text-2xl uppercase tracking-widest text-white">Standings</h1>
        </motion.div>
        <p className="text-white/45 ml-4 text-xs font-mono">Track qualified teams and group stages from top tournaments.</p>
      </div>

      {/* Competition selector */}
      <div className="relative mb-8 w-fit z-30" id="competition-selector">
        <button
          onClick={() => setOpen(!open)}
          className="group block transition-all active:scale-[0.98]"
          style={{
            clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))",
          }}
        >
          {/* Outer border wrapper */}
          <div
            className={cn(
              "p-[1px] transition-colors",
              open ? "bg-[#fcee0a]" : "bg-[#00f0ff]/20 group-hover:bg-[#fcee0a]"
            )}
            style={{
              clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))",
            }}
          >
            {/* Inner button */}
            <div
              className={cn(
                "flex items-center gap-3 px-5 py-2 bg-[#09090d] text-xs font-cyber font-bold uppercase tracking-widest transition-colors",
                open ? "text-[#fcee0a] bg-[#fcee0a]/5" : "text-[#00f0ff] group-hover:text-[#fcee0a]"
              )}
              style={{
                clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))",
              }}
            >
              {currentComp && (
                <div className="w-4 h-4 shrink-0 flex items-center justify-center bg-black border border-white/10 p-[1px]">
                  <img
                    src={getCompetitionEmblem(currentComp.code)}
                    alt={currentComp.name}
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
              <span>{currentComp?.name}</span>
              <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", open ? "rotate-180 text-[#fcee0a]" : "text-[#00f0ff]/60 group-hover:text-[#fcee0a]")} />
            </div>
          </div>
        </button>

        {open && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-full mt-2 left-0 bg-[#07070b]/98 border border-[#00f0ff]/25 z-20 min-w-[240px] shadow-[0_0_30px_rgba(0,240,255,0.15)] max-h-[350px] overflow-y-auto scrollbar-cyber"
            style={{ backdropFilter: "blur(12px)" }}
          >
            {COMPS.map((comp) => (
              <button
                key={comp.code}
                id={`comp-${comp.code}`}
                onClick={() => { setSelected(comp.code); setOpen(false); }}
                className={cn(
                  "flex items-center gap-3 w-full px-5 py-3.5 text-[10px] font-cyber font-bold uppercase tracking-wider text-left transition-colors border-b border-[#00f0ff]/10",
                  selected === comp.code
                    ? "bg-[#fcee0a] text-black border-[#fcee0a]"
                    : "text-white/60 hover:text-[#00f0ff] hover:bg-[#00f0ff]/8"
                )}
              >
                <div className="w-5 h-5 shrink-0 flex items-center justify-center bg-black/50 p-[1px] border border-white/10">
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
          <div 
            className="bg-[#09090d] border border-[#00f0ff]/18 p-6 relative"
            style={{ clipPath: "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))" }}
          >
            <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 border-[#fcee0a]" />
            <LoadingSkeleton variant="standing-row" count={8} />
          </div>
        ) : selected === "WC" && standings ? (
          /* World Cup 2026 - Render 12 Groups grid */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {standings.standings.map((groupTable) => (
              <div
                key={groupTable.group}
                className="bg-[#09090d] border border-[#00f0ff]/15 p-5 flex flex-col relative"
                style={{
                  clipPath: "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))",
                }}
              >
                {/* Accent corners */}
                <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 border-[#fcee0a] z-10" />
                <div className="absolute bottom-0 right-0 w-5 h-[2px] bg-[#ff0055] z-10" />

                <h3 className="text-xs font-cyber font-black text-white uppercase tracking-widest mb-4 pb-2 border-b border-[#00f0ff]/15">
                  {groupTable.group}
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="text-[9.5px] font-cyber font-black text-[#00f0ff]/60 uppercase tracking-widest border-b border-[#00f0ff]/15 bg-[#00f0ff]/3">
                        <th className="py-2 text-center w-8 font-cyber">#</th>
                        <th className="py-2 font-cyber">Team</th>
                        <th className="py-2 text-center w-8 font-cyber">P</th>
                        <th className="py-2 text-center w-8 font-cyber">GD</th>
                        <th className="py-2 text-right w-10 font-cyber text-[#00f0ff]">PTS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#00f0ff]/10">
                      {groupTable.table.map((row) => {
                        const advanced = row.position <= 2;
                        return (
                          <tr key={row.team.id} className="hover:bg-[#00f0ff]/2 transition-colors border-b border-[#00f0ff]/5">
                            <td className="py-3 text-center font-cyber font-bold">
                              <span className={advanced ? "text-[#fcee0a] font-extrabold" : "text-white/30 font-mono"}>
                                {row.position}
                              </span>
                            </td>
                            <td className="py-3">
                              <div className="flex items-center gap-2">
                                <TeamCrest
                                  tla={row.team.tla}
                                  crest={row.team.crest}
                                  name={row.team.name}
                                  size={20}
                                  className="rounded-none border-[#00f0ff]/25 bg-black"
                                />
                                <span className={cn("font-cyber font-bold text-xs", advanced ? "text-white" : "text-white/60")}>
                                  {row.team.name}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 text-center text-white/50 font-mono">{row.playedGames}</td>
                            <td className="py-3 text-center text-white/50 font-mono">
                              {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                            </td>
                            <td className="py-3 text-right font-cyber font-black text-[#00f0ff]">{row.points}</td>
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
          <div
            className="bg-[#09090d] border border-[#00f0ff]/18 p-5 relative"
            style={{
              clipPath: "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))",
            }}
          >
            {/* Accent corners */}
            <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 border-[#fcee0a] z-10" />
            <div className="absolute bottom-0 right-0 w-5 h-[2px] bg-[#ff0055] z-10" />

            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#00f0ff]/15">
              <span className="text-[#00f0ff]/65 text-xs font-cyber font-black uppercase tracking-widest">
                {standings.competition.name}
              </span>
              {standings.season.currentMatchday && (
                <span className="text-white/70 text-xs font-cyber font-bold uppercase tracking-widest">
                  Matchday {standings.season.currentMatchday}
                </span>
              )}
            </div>
            <StandingsTable table={standings.standings[0]?.table || []} />
          </div>
        ) : (
          <div 
            className="bg-[#09090d] border border-[#00f0ff]/18 p-12 text-center text-white/40 relative"
            style={{ clipPath: "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))" }}
          >
            <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 border-[#fcee0a]" />
            No standings available.
          </div>
        )}
      </motion.div>
    </div>
  );
}
