"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { X, Zap } from "lucide-react";

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

  return (
    <div
      role="banner"
      aria-label="Site notification"
      className="relative w-full overflow-hidden py-2 text-[10px] font-cyber font-bold uppercase tracking-widest text-black flex items-center z-40 select-none"
      style={{
        background: "linear-gradient(90deg, #fcee0a 0%, #00f0ff 50%, #fcee0a 100%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 4s linear infinite",
      }}
    >
      {/* Left accent */}
      <div className="shrink-0 flex items-center gap-1.5 pl-4 pr-3 border-r border-black/20">
        <Zap className="w-3 h-3 fill-current" />
        <span>ALERT</span>
      </div>

      {/* Infinite marquee */}
      <div className="flex-1 overflow-hidden relative">
        <div className="animate-marquee hover:pause-marquee whitespace-nowrap flex gap-16">
          <span>{config.text}</span>
          <span>{config.text}</span>
          <span>{config.text}</span>
          <span>{config.text}</span>
          <span>{config.text}</span>
        </div>
      </div>

      <button
        onClick={handleClose}
        className="shrink-0 p-1 mr-3 bg-black/15 hover:bg-black/30 text-black transition-colors duration-200"
        title="Close Notification"
        aria-label="Close Notification"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}
