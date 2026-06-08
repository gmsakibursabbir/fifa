"use client";

import { useState, useEffect } from "react";
import { getTeamFlagUrl, cn } from "@/lib/utils";

interface TeamCrestProps {
  tla?: string;
  crest?: string;
  name: string;
  size?: number;
  className?: string;
}

export default function TeamCrest({
  tla = "",
  crest = "",
  name,
  size = 32,
  className,
}: TeamCrestProps) {
  const flagUrl = getTeamFlagUrl(tla, crest);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [flagUrl]);

  return (
    <div
      className={cn(
        "relative rounded-full overflow-hidden bg-white/5 border border-white/10 flex-shrink-0 flex items-center justify-center font-sans select-none",
        className
      )}
      style={{ width: size, height: size }}
    >
      {flagUrl && !imgError ? (
        <img
          src={flagUrl}
          alt={name}
          width={size}
          height={size}
          className="object-contain w-full h-full"
          onError={() => setImgError(true)}
        />
      ) : (
        <div 
          className="w-full h-full flex items-center justify-center font-bold text-white/50 bg-white/5 uppercase"
          style={{ fontSize: size * 0.28 }}
        >
          {tla ? tla.slice(0, 3) : name.slice(0, 2)}
        </div>
      )}
    </div>
  );
}
