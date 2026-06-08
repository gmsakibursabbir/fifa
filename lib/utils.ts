import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { MatchStatus } from "@/types/football";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format UTC date string to local time */
export function formatMatchDate(utcDate: string): string {
  const date = new Date(utcDate);
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Format UTC date to local time only */
export function formatMatchTime(utcDate: string): string {
  const date = new Date(utcDate);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

/** Format minutes elapsed in a match */
export function formatMinute(minute?: number | null, injuryTime?: number | null): string {
  if (!minute) return "";
  if (injuryTime) return `${minute}+${injuryTime}'`;
  return `${minute}'`;
}

/** Check if a match is currently live */
export function isMatchLive(status: MatchStatus): boolean {
  return status === "IN_PLAY" || status === "PAUSED";
}

/** Check if today */
export function isToday(utcDate: string): boolean {
  const match = new Date(utcDate);
  const now = new Date();
  return (
    match.getFullYear() === now.getFullYear() &&
    match.getMonth() === now.getMonth() &&
    match.getDate() === now.getDate()
  );
}

/** Get status label */
export function getStatusLabel(status: MatchStatus, minute?: number | null): string {
  switch (status) {
    case "IN_PLAY":  return minute ? `${minute}'` : "LIVE";
    case "PAUSED":   return "HT";
    case "FINISHED": return "FT";
    case "SCHEDULED":
    case "TIMED":    return "Upcoming";
    case "POSTPONED": return "Postponed";
    case "CANCELLED": return "Cancelled";
    case "SUSPENDED": return "Suspended";
    default:         return status;
  }
}

/** Get status CSS class */
export function getStatusClass(status: MatchStatus): string {
  switch (status) {
    case "IN_PLAY":
    case "PAUSED":   return "match-status-live";
    case "FINISHED": return "match-status-finished";
    default:         return "match-status-upcoming";
  }
}

/** Truncate long text */
export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen) + "…";
}

/** Format number with commas */
export function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-GB").format(n);
}

/** Calculate possession percentage */
export function calcPct(home: number, away: number): { home: number; away: number } {
  const total = home + away;
  if (total === 0) return { home: 50, away: 50 };
  return {
    home: Math.round((home / total) * 100),
    away: Math.round((away / total) * 100),
  };
}

/** Convert local storage favorites to Set */
export function getFavoritesSet(key: string): Set<number> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as number[]);
  } catch {
    return new Set();
  }
}

/** Save favorites Set to localStorage */
export function saveFavoritesSet(key: string, set: Set<number>): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(Array.from(set)));
}

const TLA_TO_ISO: Record<string, string> = {
  USA: "us",
  MEX: "mx",
  SWE: "se",
  NZL: "nz",
  CAN: "ca",
  ARG: "ar",
  NGA: "ng",
  KSA: "sa",
  FRA: "fr",
  AUS: "au",
  KOR: "kr",
  HON: "hn",
  ENG: "gb",
  ECU: "ec",
  DEN: "dk",
  ANG: "ao",
  BRA: "br",
  JPN: "jp",
  TUR: "tr",
  CMR: "cm",
  BEL: "be",
  MAR: "ma",
  COL: "co",
  JAM: "jm",
  ESP: "es",
  SUI: "ch",
  GHA: "gh",
  CHN: "cn",
  POR: "pt",
  URU: "uy",
  EGY: "eg",
  IRQ: "iq",
  GER: "de",
  POL: "pl",
  ALG: "dz",
  PER: "pe",
  NED: "nl",
  CRO: "hr",
  SEN: "sn",
  CRC: "cr",
  ITA: "it",
  AUT: "at",
  CHI: "cl",
  TUN: "tn",
  UKR: "ua",
  PAN: "pa",
  IRN: "ir",
  RSA: "za",
  BIH: "ba",
  PAR: "py",
};

export function getTeamFlagUrl(tla: string, fallbackCrest?: string): string {
  const code = (tla || "").toUpperCase();
  if (TLA_TO_ISO[code]) {
    return `https://flagfeed.com/country/${TLA_TO_ISO[code]}`;
  }
  return fallbackCrest || "";
}

// Keep getTeamFlag as a text-emoji fallback if needed, or simple helper
export function getTeamFlag(tla: string, name?: string): string {
  const code = (tla || "").toUpperCase();
  // Return emoji as backup
  const EMOJI_MAP: Record<string, string> = {
    USA: "🇺🇸", MEX: "🇲🇽", CAN: "🇨🇦", ARG: "🇦🇷", FRA: "🇫🇷", ENG: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", BRA: "🇧🇷", ESP: "🇪🇸", GER: "🇩🇪", ITA: "🇮🇹"
  };
  return EMOJI_MAP[code] || "";
}

const COMP_EMBLEMS: Record<string, string> = {
  PL: "https://media.api-sports.io/football/leagues/39.png",
  BL1: "https://media.api-sports.io/football/leagues/78.png",
  SA: "https://media.api-sports.io/football/leagues/135.png",
  PD: "https://media.api-sports.io/football/leagues/140.png",
  FL1: "https://media.api-sports.io/football/leagues/61.png",
  CL: "https://media.api-sports.io/football/leagues/2.png",
  EC: "https://media.api-sports.io/football/leagues/4.png",
  WC: "https://media.api-sports.io/football/leagues/1.png",
  DED: "https://media.api-sports.io/football/leagues/94.png",
};

export function getCompetitionEmblem(code: string): string {
  return COMP_EMBLEMS[code.toUpperCase()] || "";
}

