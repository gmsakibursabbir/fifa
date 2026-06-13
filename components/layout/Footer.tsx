"use client";

import Link from "next/link";
import { Zap, Heart, Radio } from "lucide-react";
import { getCompetitionEmblem } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/matches", label: "Matches" },
  { href: "/schedule", label: "Schedule" },
  { href: "/watch", label: "Watch IPTV" },
  { href: "/standings", label: "Standings" },
];

const COMPETITIONS = [
  { label: "FIFA World Cup 2026", code: "WC" },
  { label: "Premier League", code: "PL" },
  { label: "UEFA Champions League", code: "CL" },
  { label: "La Liga", code: "PD" },
  { label: "Serie A", code: "SA" },
];

export default function Footer() {
  return (
    <footer
      aria-label="Site footer"
      className="relative border-t border-[#00f0ff]/12 bg-[#030306] mt-20 text-white/40 overflow-hidden"
    >
      {/* Subtle grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,240,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,240,255,0.04) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
        aria-hidden="true"
      />

      {/* Top neon line */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(0,240,255,0.4), transparent)" }}
        aria-hidden="true"
      />

      <div className="relative max-w-[1600px] mx-auto px-5 sm:px-8 md:px-16 pt-12 sm:pt-16 pb-32 sm:pb-36">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-12">

          {/* Brand */}
          <div className="col-span-2 space-y-5">
            <Link href="/" className="flex items-center gap-3 group w-fit" aria-label="FIFA Live Hub">
              <div className="relative overflow-hidden w-10 h-10 border border-[#00f0ff]/25 group-hover:border-[#fcee0a]/60 transition-colors flex items-center justify-center bg-black">
                <img
                  src="/mascots.png"
                  alt="FIFA Live Hub logo"
                  className="object-cover w-full h-full scale-[1.15] select-none group-hover:scale-125 transition-transform duration-300"
                />
              </div>
              <span className="font-cyber font-black text-lg tracking-widest text-white uppercase group-hover:text-[#fcee0a] transition-colors">
                FIFA Live Hub
              </span>
            </Link>
            <p className="text-xs leading-relaxed max-w-sm font-sans">
              A premium match tracker and live TV streaming interface. Follow teams, live scores, and fixtures from the FIFA World Cup 2026 and major football leagues.
            </p>
            {/* Status indicators */}
            <div className="flex items-center gap-4 pt-1">
              <span className="flex items-center gap-1.5 text-[9px] font-cyber font-bold uppercase tracking-widest text-[#39ff14]">
                <span className="w-1.5 h-1.5 bg-[#39ff14] animate-ping inline-flex" aria-hidden="true" />
                Systems Online
              </span>
              <span className="flex items-center gap-1.5 text-[9px] font-cyber font-bold uppercase tracking-widest text-[#00f0ff]">
                <Radio className="w-3 h-3" aria-hidden="true" />
                Live Streams
              </span>
            </div>
          </div>

          {/* Navigation */}
          <div className="space-y-4">
            <h3 className="font-cyber text-white text-[10px] font-black uppercase tracking-widest">
              Navigation
            </h3>
            <div
              className="h-px mb-4"
              style={{ background: "linear-gradient(90deg, rgba(252,238,10,0.4), transparent)" }}
              aria-hidden="true"
            />
            <ul className="space-y-2.5">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-xs font-cyber font-semibold tracking-wide hover:text-[#00f0ff] transition-colors duration-200 flex items-center gap-1.5 group"
                  >
                    <span className="w-1 h-1 bg-[#fcee0a] opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Competitions */}
          <div className="space-y-4">
            <h3 className="font-cyber text-white text-[10px] font-black uppercase tracking-widest">
              Tournaments
            </h3>
            <div
              className="h-px mb-4"
              style={{ background: "linear-gradient(90deg, rgba(0,240,255,0.4), transparent)" }}
              aria-hidden="true"
            />
            <ul className="space-y-2.5">
              {COMPETITIONS.map((comp) => (
                <li key={comp.label}>
                  <Link
                    href="/standings"
                    className="flex items-center gap-2 text-xs font-cyber font-semibold tracking-wide hover:text-[#00f0ff] transition-colors duration-200 group"
                  >
                    <div className="w-4 h-4 shrink-0 flex items-center justify-center opacity-70 group-hover:opacity-100 transition-opacity">
                      <img
                        src={getCompetitionEmblem(comp.code)}
                        alt={comp.label}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <span className="truncate">{comp.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="mt-14 pt-8 flex flex-col md:flex-row items-center justify-between gap-6 text-[9px] font-cyber font-bold uppercase tracking-widest"
          style={{ borderTop: "1px solid rgba(0,240,255,0.08)" }}
        >
          <p className="text-white/30">
            © {new Date().getFullYear()} FIFA Live Hub — Data:{" "}
            <a
              href="https://www.football-data.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#00f0ff]/70 hover:text-[#00f0ff] transition-colors underline"
            >
              football-data.org
            </a>
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1.5 text-white/50">
              Built with{" "}
              <Heart className="w-3 h-3 text-[#ff0055] fill-[#ff0055] animate-pulse" aria-hidden="true" />
              {" "}by{" "}
              <span className="text-[#fcee0a]">DevOpsInquisitor</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
