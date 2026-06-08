// ─────────────────────────────────────────────
// IPTV Channel Types
// ─────────────────────────────────────────────

export interface Channel {
  id: number;
  name: string;
  logo: string;
  stream: string;
  category: ChannelCategory;
  description?: string;
  language?: string;
  country?: string;
  isLive?: boolean;
  quality?: "HD" | "FHD" | "4K" | "SD";
  featured?: boolean;
  isIptv?: boolean;
}

export type ChannelCategory =
  | "Sports"
  | "Football"
  | "News"
  | "Entertainment"
  | "Documentary"
  | "Other";

export const CHANNEL_CATEGORIES: ChannelCategory[] = [
  "Sports",
  "Football",
  "News",
  "Entertainment",
  "Documentary",
  "Other",
];

export interface FavoriteChannel {
  id: number;
  addedAt: string;
}

export interface RecentChannel {
  id: number;
  watchedAt: string;
}

export interface FeaturedItem {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  link: string;
  type: "match" | "channel" | "news";
  badge?: string;
}

export interface Banner {
  id: string;
  title: string;
  description: string;
  image: string;
  cta: string;
  ctaLink: string;
  active: boolean;
}
