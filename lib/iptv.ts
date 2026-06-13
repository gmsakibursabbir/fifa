import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { getGitHubFile, updateGitHubFile } from "@/lib/github";
import { isGitHubConfigured, loadChannels, saveChannels } from "@/lib/channels";
import type { Channel } from "@/types/channel";

const CONFIG_PATH = join(process.cwd(), "data", "iptv_config.json");

export interface IPTVConfig {
  playlistUrl: string;
  autoUpdate: boolean;
  lastUpdated?: string;
  channelCount?: number;
  syncMode?: "overwrite" | "merge";
}

export async function loadIPTVConfig(): Promise<IPTVConfig | null> {
  if (isGitHubConfigured()) {
    try {
      const fileData = await getGitHubFile("data/iptv_config.json");
      if (fileData && typeof fileData.content === "object") {
        return fileData.content as IPTVConfig;
      }
    } catch (error) {
      console.error("Failed to load IPTV config from GitHub, trying local file:", error);
    }
  }

  try {
    if (existsSync(CONFIG_PATH)) {
      return JSON.parse(readFileSync(CONFIG_PATH, "utf-8")) as IPTVConfig;
    }
  } catch (error) {
    console.error("Local IPTV config load error:", error);
  }
  return null;
}

export async function saveIPTVConfig(config: IPTVConfig): Promise<boolean> {
  if (isGitHubConfigured()) {
    try {
      const fileData = await getGitHubFile("data/iptv_config.json");
      const sha = fileData?.sha || "";
      const success = await updateGitHubFile(
        "data/iptv_config.json",
        config,
        sha,
        "Update IPTV config via admin panel"
      );
      if (success) return true;
    } catch (error) {
      console.error("Failed to save IPTV config to GitHub, trying local file:", error);
    }
  }

  try {
    writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), "utf-8");
    return true;
  } catch (error) {
    console.error("Local IPTV config save error:", error);
    return false;
  }
}

export function parseM3U(text: string): Partial<Channel>[] {
  const lines = text.split("\n");
  const channels: Partial<Channel>[] = [];
  let currentChannel: Partial<Channel> = {};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith("#EXTINF:")) {
      currentChannel = { isLive: true, featured: false, quality: "HD", category: "Sports" };
      const logoMatch = line.match(/tvg-logo="([^"]+)"/);
      if (logoMatch) currentChannel.logo = logoMatch[1];
      
      const groupMatch = line.match(/group-title="([^"]+)"/);
      if (groupMatch) {
        const title = groupMatch[1].toLowerCase();
        if (title.includes("sport") || title.includes("football") || title.includes("fifa") || title.includes("live")) {
          currentChannel.category = "Sports";
        } else if (title.includes("news")) {
          currentChannel.category = "News";
        } else if (title.includes("ent") || title.includes("show") || title.includes("movie")) {
          currentChannel.category = "Entertainment";
        } else if (title.includes("doc")) {
          currentChannel.category = "Documentary";
        } else {
          currentChannel.category = "Other";
        }
      }
      
      const commaIdx = line.lastIndexOf(",");
      currentChannel.name = commaIdx !== -1 ? line.substring(commaIdx + 1).trim() : "M3U Stream";
    } else if (line && !line.startsWith("#")) {
      currentChannel.stream = line;
      if (currentChannel.name) channels.push(currentChannel);
      currentChannel = {};
    }
  }
  return channels;
}

export async function syncIPTVPlaylist(): Promise<{ success: boolean; count: number; error?: string }> {
  const config = await loadIPTVConfig();
  if (!config || !config.playlistUrl) {
    return { success: false, count: 0, error: "IPTV URL not configured" };
  }

  try {
    const res = await fetch(config.playlistUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) VLC/3.0.18",
      },
    });
    if (!res.ok) {
      return { success: false, count: 0, error: `HTTP error ${res.status}` };
    }
    const text = await res.text();
    const parsed = parseM3U(text);
    if (parsed.length === 0) {
      return { success: false, count: 0, error: "No channels found in M3U content" };
    }

    const existingChannels = await loadChannels();
    let updatedChannels: Channel[] = [];

    // "merge" syncMode preserves manual channels and deletes old IPTV channels.
    // "overwrite" deletes everything (both manual and IPTV) to completely match the M3U playlist.
    if (config.syncMode === "merge") {
      const manualChannels = existingChannels.filter((c) => !c.isIptv);
      updatedChannels = [...manualChannels];
    } else {
      updatedChannels = []; // Overwrite completely
    }

    const startId = Math.max(0, ...updatedChannels.map((c) => c.id), Date.now());
    const newChannels: Channel[] = parsed.map((ch, idx) => ({
      id: startId + idx + 1,
      name: ch.name || "IPTV Stream",
      logo: ch.logo || "",
      stream: ch.stream || "",
      category: ch.category || "Sports",
      description: ch.description || "IPTV Live Stream",
      language: ch.language || "English",
      country: ch.country || "Global",
      isLive: ch.isLive ?? true,
      quality: ch.quality || "HD",
      featured: ch.featured ?? false,
      isIptv: true,
    }));

    // Enforce 3,000 channels limit to avoid serverless function execution payload/timeout issues.
    const limitedNewChannels = newChannels.slice(0, 3000);
    const finalChannels = [...updatedChannels, ...limitedNewChannels];
    await saveChannels(finalChannels);

    // Update config status
    config.lastUpdated = new Date().toISOString();
    config.channelCount = limitedNewChannels.length;
    await saveIPTVConfig(config);

    return { success: true, count: limitedNewChannels.length };
  } catch (error: any) {
    console.error("IPTV playlist sync error:", error);
    return { success: false, count: 0, error: error.message || "Failed to fetch or parse playlist" };
  }
}
