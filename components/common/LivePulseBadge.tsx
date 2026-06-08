"use client";

import { cn } from "@/lib/utils";

interface LivePulseBadgeProps {
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function LivePulseBadge({
  label = "LIVE",
  size = "md",
  className,
}: LivePulseBadgeProps) {
  const sizeClasses = {
    sm: "text-[10px] px-2 py-0.5 gap-1",
    md: "text-xs px-2.5 py-1 gap-1.5",
    lg: "text-sm px-3 py-1.5 gap-2",
  };

  const dotSizes = {
    sm: "w-1.5 h-1.5",
    md: "w-2 h-2",
    lg: "w-2.5 h-2.5",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-bold tracking-wider",
        "bg-red-500/15 text-red-400 border border-red-500/20",
        sizeClasses[size],
        className
      )}
    >
      {/* Pulse dot */}
      <span className={cn("relative flex", dotSizes[size])}>
        <span
          className={cn(
            "animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"
          )}
        />
        <span
          className={cn(
            "relative inline-flex rounded-full bg-red-500",
            dotSizes[size]
          )}
        />
      </span>
      {label}
    </span>
  );
}
