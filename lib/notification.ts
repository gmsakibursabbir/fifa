import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { getGitHubFile, updateGitHubFile } from "@/lib/github";
import { isGitHubConfigured } from "@/lib/channels";

const CONFIG_PATH = join(process.cwd(), "data", "notification.json");

export interface NotificationConfig {
  text: string;
  active: boolean;
  color?: string;
}

export const DEFAULT_NOTIFICATION: NotificationConfig = {
  text: "Welcome to FIFA Live Hub! Reorder channels and stream securely.",
  active: false,
  color: "bg-linear-to-r from-cyan-600/90 to-blue-600/90",
};

export async function loadNotificationConfig(): Promise<NotificationConfig> {
  if (isGitHubConfigured()) {
    try {
      const fileData = await getGitHubFile("data/notification.json");
      if (fileData && typeof fileData.content === "object" && !Array.isArray(fileData.content)) {
        return fileData.content as unknown as NotificationConfig;
      }
    } catch (error) {
      console.error("Failed to load Notification config from GitHub, trying local file:", error);
    }
  }

  try {
    if (existsSync(CONFIG_PATH)) {
      return JSON.parse(readFileSync(CONFIG_PATH, "utf-8")) as NotificationConfig;
    }
  } catch (error) {
    console.error("Local notification config load error:", error);
  }
  return DEFAULT_NOTIFICATION;
}

export async function saveNotificationConfig(config: NotificationConfig): Promise<boolean> {
  if (isGitHubConfigured()) {
    try {
      const fileData = await getGitHubFile("data/notification.json");
      const sha = fileData?.sha || "";
      const success = await updateGitHubFile(
        "data/notification.json",
        config,
        sha,
        "Update notification config via admin panel"
      );
      if (success) return true;
    } catch (error) {
      console.error("Failed to save notification config to GitHub, trying local file:", error);
    }
  }

  try {
    writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), "utf-8");
    return true;
  } catch (error) {
    console.error("Local notification config save error:", error);
    return false;
  }
}
