"use client";

import { motion } from "framer-motion";
import { Activity, Clock, CheckCircle, Calendar } from "lucide-react";
import type { FilterStatus } from "@/types/football";
import { cn } from "@/lib/utils";

interface MatchFilterProps {
  value: FilterStatus;
  onChange: (v: FilterStatus) => void;
  counts?: Partial<Record<FilterStatus, number>>;
}

const FILTERS: { key: FilterStatus; label: string; icon: React.ElementType }[] = [
  { key: "LIVE",     label: "Live",     icon: Activity },
  { key: "TODAY",    label: "Today",    icon: Clock },
  { key: "FINISHED", label: "Finished", icon: CheckCircle },
  { key: "UPCOMING", label: "Upcoming", icon: Calendar },
];

export default function MatchFilter({ value, onChange, counts }: MatchFilterProps) {
  return (
    <div className="flex items-center gap-1 p-1 glass rounded-2xl w-fit">
      {FILTERS.map(({ key, label, icon: Icon }) => {
        const active = value === key;
        return (
          <button
            key={key}
            id={`filter-${key.toLowerCase()}`}
            onClick={() => onChange(key)}
            className={cn(
              "relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
              active
                ? "text-white"
                : "text-gray-500 hover:text-gray-300"
            )}
          >
            {active && (
              <motion.div
                layoutId="filter-bg"
                className={cn(
                  "absolute inset-0 rounded-xl",
                  key === "LIVE"
                    ? "bg-red-500/20 border border-red-500/30"
                    : "bg-cyan-500/15 border border-cyan-500/20"
                )}
                transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
              />
            )}
            <Icon className={cn("w-4 h-4 relative z-10", key === "LIVE" && active && "text-red-400")} />
            <span className="relative z-10">{label}</span>
            {counts?.[key] !== undefined && (
              <span
                className={cn(
                  "relative z-10 text-xs rounded-full px-1.5 py-0.5 font-bold min-w-[20px] text-center",
                  active
                    ? key === "LIVE" ? "bg-red-500/30 text-red-300" : "bg-cyan-500/30 text-cyan-300"
                    : "bg-white/5 text-gray-600"
                )}
              >
                {counts[key]}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
