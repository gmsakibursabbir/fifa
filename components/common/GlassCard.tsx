"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: "cyan" | "gold" | "live" | "none";
  onClick?: () => void;
  animate?: boolean;
  delay?: number;
}

export default function GlassCard({
  children,
  className,
  hover = false,
  glow = "none",
  onClick,
  animate = true,
  delay = 0,
}: GlassCardProps) {
  const glowClass = {
    cyan: "glow-cyan",
    gold: "glow-gold",
    live: "glow-live",
    none: "",
  }[glow];

  return (
    <motion.div
      initial={animate ? { opacity: 0, y: 16 } : false}
      animate={animate ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
      whileHover={hover ? { y: -4, scale: 1.01 } : undefined}
      onClick={onClick}
      className={cn(
        "glass rounded-2xl",
        glowClass,
        hover && "glass-hover cursor-pointer",
        onClick && "cursor-pointer",
        className
      )}
    >
      {children}
    </motion.div>
  );
}
