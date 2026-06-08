"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Tv, Activity, Trophy, Home, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/",          label: "Home",      icon: Home },
  { href: "/matches",   label: "Matches",   icon: Activity },
  { href: "/schedule",  label: "Schedule",  icon: Calendar },
  { href: "/watch",     label: "Watch TV",  icon: Tv },
  { href: "/standings", label: "Standings", icon: Trophy },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 sm:gap-1.5 md:gap-3 bg-black/70 backdrop-blur-2xl border border-white/10 rounded-full py-1.5 sm:py-2 px-2 sm:px-3 md:px-4 shadow-[0_20px_50px_rgba(0,0,0,0.8)] max-w-[96vw] md:max-w-none transition-all duration-300">
      {/* Brand Icon */}
      <Link
        href="/"
        className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black border border-white/10 hover:border-white/20 transition-all overflow-hidden shrink-0 group"
      >
        <img
          src="/mascots.png"
          alt="FIFA Live Hub Mascot"
          className="w-full h-full object-cover scale-[1.15] select-none group-hover:scale-125 transition-transform duration-300"
        />
      </Link>

      {/* Separator line */}
      <div className="w-px h-4 sm:h-5 bg-white/10 self-center shrink-0" />

      {/* Nav items */}
      <nav className="flex items-center gap-0.5 sm:gap-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex items-center justify-center py-2 px-2.5 sm:py-2.5 sm:px-3.5 md:px-5 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider transition-all duration-300 select-none shrink-0",
                active ? "text-black" : "text-white/60 hover:text-white hover:bg-white/5"
              )}
            >
              {active && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute inset-0 bg-white rounded-full"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5 sm:gap-2">
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span className="hidden md:inline">{item.label}</span>
              </span>
              {item.href === "/matches" && (
                <span className="absolute top-0.5 right-1 sm:top-1 sm:right-2 flex h-1.5 w-1.5 z-20">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
