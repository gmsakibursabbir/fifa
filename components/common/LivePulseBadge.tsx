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
    sm: "text-[8px] px-1.5 py-0.5 gap-1",
    md: "text-[9px] px-2 py-0.5 gap-1.5",
    lg: "text-[11px] px-2.5 py-1 gap-2",
  };

  const dotSizes = {
    sm: "w-1 h-1",
    md: "w-1.5 h-1.5",
    lg: "w-2 h-2",
  };

  return (
    <span
      role="status"
      aria-label={`${label} indicator`}
      className={cn(
        "inline-flex items-center font-cyber font-black tracking-widest uppercase",
        "bg-[#ff0055]/10 text-[#ff0055] border border-[#ff0055]/40",
        sizeClasses[size],
        className
      )}
    >
      {/* Pulse dot */}
      <span className={cn("relative flex", dotSizes[size])}>
        <span
          className={cn(
            "absolute inline-flex h-full w-full bg-[#ff0055] opacity-75 animate-ping"
          )}
        />
        <span
          className={cn(
            "relative inline-flex bg-[#ff0055]",
            dotSizes[size]
          )}
        />
      </span>
      {label}
    </span>
  );
}
