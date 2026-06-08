"use client";

import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  message?: string;
  type?: "api" | "network" | "generic";
  onRetry?: () => void;
}

export default function ErrorState({
  message,
  type = "generic",
  onRetry,
}: ErrorStateProps) {
  const config = {
    api: {
      icon: AlertTriangle,
      title: "API Key Required",
      desc: message || "Add your free football-data.org API key to .env.local to see live data.",
    },
    network: {
      icon: WifiOff,
      title: "Connection Error",
      desc: message || "Unable to connect to the server. Please check your internet connection.",
    },
    generic: {
      icon: AlertTriangle,
      title: "Something went wrong",
      desc: message || "An unexpected error occurred. Please try again.",
    },
  }[type];

  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-red-400" />
      </div>
      <h3 className="text-white font-semibold text-lg mb-2">{config.title}</h3>
      <p className="text-gray-500 text-sm max-w-sm mb-6">{config.desc}</p>
      {type === "api" && (
        <a
          href="https://www.football-data.org/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-cyan-400 text-sm hover:text-cyan-300 transition-colors underline underline-offset-2 mb-4"
        >
          Get your free API key →
        </a>
      )}
      {onRetry && (
        <Button
          onClick={onRetry}
          variant="outline"
          size="sm"
          className="border-white/10 text-gray-400 hover:text-white hover:border-white/20"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      )}
    </motion.div>
  );
}
