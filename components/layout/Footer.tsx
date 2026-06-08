"use client";

import Link from "next/link";
import { Zap, Globe, Heart } from "lucide-react";
import { getCompetitionEmblem } from "@/lib/utils";

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-black mt-20 text-white/40">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 md:px-16 pt-10 sm:pt-16 pb-28 sm:pb-32">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-3 mb-2 group">
              <div className="relative overflow-hidden w-9 h-9 rounded-full bg-black border border-white/10 transition-transform group-hover:scale-105 duration-200 flex items-center justify-center">
                <img
                  src="/mascots.png"
                  alt="FIFA 2026 Mascot Logo"
                  className="object-cover w-full h-full scale-[1.15] select-none"
                />
              </div>
              <span className="font-extrabold text-lg tracking-wider text-white uppercase font-sans">
                FIFA Live Hub
              </span>
            </Link>
            <p className="text-xs leading-relaxed max-w-sm font-medium">
              A premium match tracker and live TV streaming interface. Follow teams, live scores, and fixtures from the FIFA World Cup 2026 and major football leagues.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-white text-[10px] font-bold uppercase tracking-widest">
              Navigation
            </h3>
            <ul className="space-y-2.5 text-xs font-semibold">
              {[
                { href: "/", label: "Home" },
                { href: "/matches", label: "Matches" },
                { href: "/schedule", label: "Schedule" },
                { href: "/watch", label: "Watch IPTV" },
                { href: "/standings", label: "Standings" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="hover:text-white transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Competitions */}
          <div className="space-y-4">
            <h3 className="text-white text-[10px] font-bold uppercase tracking-widest">
              Tournaments
            </h3>
            <ul className="space-y-2.5 text-xs font-semibold">
              {[
                { label: "FIFA World Cup 2026", code: "WC" },
                { label: "Premier League", code: "PL" },
                { label: "UEFA Champions League", code: "CL" },
                { label: "La Liga", code: "PD" },
                { label: "Serie A", code: "SA" },
              ].map((comp) => (
                <li key={comp.label}>
                  <Link
                    href="/standings"
                    className="flex items-center gap-2 hover:text-white transition-colors duration-200"
                  >
                    <div className="w-4 h-4 flex-shrink-0 flex items-center justify-center">
                      <img
                        src={getCompetitionEmblem(comp.code)}
                        alt={comp.label}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <span>{comp.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 text-[10px] font-bold uppercase tracking-widest">
          <p>
            © {new Date().getFullYear()} FIFA Live Hub. Data sourced from{" "}
            <a
              href="https://www.football-data.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:underline transition-all"
            >
              football-data.org
            </a>
          </p>
          <div className="flex flex-wrap items-center gap-6">
            <span className="flex items-center gap-1 text-white/70">
              Made with <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 animate-pulse" /> by <span className="text-white font-extrabold">DevOpsInquisitor</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
