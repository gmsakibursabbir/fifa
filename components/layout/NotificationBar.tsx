"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface NotificationConfig {
  text: string;
  active: boolean;
  color?: string;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch notification");
  return res.json() as Promise<NotificationConfig>;
};

export default function NotificationBar() {
  const { data: config } = useSWR<NotificationConfig>("/api/notification", fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  const [isClosed, setIsClosed] = useState(true);

  useEffect(() => {
    const closedState = sessionStorage.getItem("notification_closed");
    if (closedState !== "true") {
      setIsClosed(false);
    }
  }, []);

  const handleClose = () => {
    sessionStorage.setItem("notification_closed", "true");
    setIsClosed(true);
  };

  if (!config || !config.active || isClosed || !config.text) {
    return null;
  }

  const barColor = config.color || "bg-linear-to-r from-cyan-600/90 to-blue-600/90";

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden py-2.5 text-[11px] font-extrabold uppercase tracking-wider text-white flex items-center border-b border-white/5 select-none shadow-md z-40",
        barColor
      )}
    >
      <div className="flex-1 overflow-hidden relative">
        {/* Infinite marquee */}
        <div className="animate-marquee hover:pause-marquee whitespace-nowrap flex gap-16 md:gap-24">
          <span>{config.text}</span>
          <span>{config.text}</span>
          <span>{config.text}</span>
          <span>{config.text}</span>
          <span>{config.text}</span>
        </div>
      </div>

      <button
        onClick={handleClose}
        className="shrink-0 p-1.5 mr-4 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors duration-200"
        title="Close Notification"
        aria-label="Close Notification"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
