"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Tv, Activity, Trophy, Home, Calendar, Volume2, VolumeX, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { playClickSound, playHoverSound, getMuteState, setMuteState } from "@/lib/audio";

const NAV_ITEMS = [
  { href: "/",          label: "Home",      icon: Home },
  { href: "/matches",   label: "Matches",   icon: Activity },
  { href: "/schedule",  label: "Schedule",  icon: Calendar },
  { href: "/watch",     label: "Watch TV",  icon: Tv },
  { href: "/standings", label: "Standings", icon: Trophy },
];

export default function Navbar() {
  const pathname = usePathname();
  const [muted, setMuted] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setMuted(getMuteState());
    const handleMuteChange = (e: Event) => {
      setMuted((e as CustomEvent).detail);
    };
    window.addEventListener("cyber_mute_changed", handleMuteChange);
    return () => window.removeEventListener("cyber_mute_changed", handleMuteChange);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleToggleMute = () => {
    const nextMuted = !muted;
    setMuteState(nextMuted);
    setMuted(nextMuted);
    if (!nextMuted) setTimeout(() => playClickSound(), 50);
  };

  return (
    <nav
      aria-label="Main navigation"
      className={cn(
        "fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-0.5 sm:gap-1 max-w-[96vw]",
        "transition-all duration-300",
        "border border-[#00f0ff]/25 bg-[#07070b]/96",
        "shadow-[0_0_40px_rgba(0,240,255,0.12),0_4px_30px_rgba(0,0,0,0.7)]",
        scrolled && "shadow-[0_0_50px_rgba(0,240,255,0.2),0_4px_40px_rgba(0,0,0,0.8)]"
      )}
      style={{ backdropFilter: "blur(20px)" }}
    >
      {/* Left HUD accent bar */}
      <div className="w-1 h-6 bg-[#fcee0a] self-center shrink-0 hidden sm:block" aria-hidden="true" />

      {/* Brand icon */}
      <Link
        href="/"
        onClick={() => playClickSound()}
        onMouseEnter={() => playHoverSound()}
        aria-label="FIFA Live Hub home"
        className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 border border-[#00f0ff]/20 hover:border-[#fcee0a]/60 transition-all overflow-hidden shrink-0 group mx-1 sm:mx-2"
      >
        <img
          src="/mascots.png"
          alt=""
          aria-hidden="true"
          className="w-full h-full object-cover scale-[1.15] select-none group-hover:scale-125 transition-transform duration-300"
        />
      </Link>

      {/* Vertical divider */}
      <div className="w-px h-5 bg-[#00f0ff]/15 self-center shrink-0" aria-hidden="true" />

      {/* Nav items */}
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => playClickSound()}
            onMouseEnter={() => playHoverSound()}
            aria-label={item.label}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative flex items-center justify-center py-2.5 px-3 sm:px-4 md:px-5",
              "text-[10px] md:text-[11px] font-cyber font-bold uppercase tracking-widest",
              "transition-all duration-200 select-none shrink-0",
              active ? "text-black" : "text-white/50 hover:text-[#00f0ff]"
            )}
          >
            {active && (
              <motion.div
                layoutId="activeNav"
                className="absolute inset-0 bg-[#fcee0a]"
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
                aria-hidden="true"
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5 sm:gap-2">
              <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="hidden md:inline">{item.label}</span>
            </span>
            {/* Live dot for Matches */}
            {item.href === "/matches" && (
              <span className="absolute top-1 right-1.5 flex h-1.5 w-1.5 z-20" aria-label="Live matches available">
                <span className="animate-ping absolute inline-flex h-full w-full bg-[#ff0055] opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 bg-[#ff0055]" />
              </span>
            )}
          </Link>
        );
      })}

      {/* Vertical divider */}
      <div className="w-px h-5 bg-[#00f0ff]/15 self-center shrink-0 mx-0.5" aria-hidden="true" />

      {/* Mute toggle */}
      <button
        onClick={handleToggleMute}
        onMouseEnter={() => playHoverSound()}
        aria-label={muted ? "Unmute UI sounds" : "Mute UI sounds"}
        aria-pressed={muted}
        className={cn(
          "p-2 transition-colors cursor-pointer",
          muted ? "text-white/25 hover:text-white/50" : "text-[#00f0ff] hover:text-[#fcee0a]"
        )}
      >
        {muted ? <VolumeX className="w-4 h-4 shrink-0" /> : <Volume2 className="w-4 h-4 shrink-0" />}
      </button>

      {/* Right HUD accent bar */}
      <div className="w-1 h-6 bg-[#ff0055] self-center shrink-0 hidden sm:block" aria-hidden="true" />
    </nav>
  );
}
