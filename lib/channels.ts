import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { getGitHubFile, updateGitHubFile } from "@/lib/github";
import type { Channel } from "@/types/channel";

const DATA_PATH = join(process.cwd(), "data", "channels.json");

export function isGitHubConfigured(): boolean {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.NEXT_PUBLIC_GITHUB_OWNER;
  const repo = process.env.NEXT_PUBLIC_GITHUB_REPO;

  return !!(
    token &&
    owner &&
    repo &&
    token !== "your_github_personal_access_token" &&
    owner !== "your_github_username" &&
    repo !== "your_repo_name"
  );
}

export async function loadChannels(): Promise<Channel[]> {
  if (isGitHubConfigured()) {
    try {
      const fileData = await getGitHubFile("data/channels.json");
      if (fileData && Array.isArray(fileData.content)) {
        return fileData.content as Channel[];
      }
    } catch (error) {
      console.error("Failed to load channels from GitHub, trying local file:", error);
    }
  }

  // Local filesystem fallback
  try {
    return JSON.parse(readFileSync(DATA_PATH, "utf-8")) as Channel[];
  } catch (error) {
    console.error("Local channels load error:", error);
    return [];
  }
}

export async function saveChannels(channels: Channel[]): Promise<boolean> {
  if (isGitHubConfigured()) {
    try {
      const fileData = await getGitHubFile("data/channels.json");
      const sha = fileData?.sha || "";
      const success = await updateGitHubFile(
        "data/channels.json",
        channels,
        sha,
        "Update channels via admin panel"
      );
      if (success) {
        return true;
      }
      console.error("GitHub update failed, falling back to local filesystem write.");
    } catch (error) {
      console.error("Failed to save channels to GitHub, trying local file:", error);
    }
  }

  // Local filesystem fallback
  try {
    writeFileSync(DATA_PATH, JSON.stringify(channels, null, 2), "utf-8");
    return true;
  } catch (error) {
    console.error("Local channels save error:", error);
    return false;
  }
}
