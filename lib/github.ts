// ─────────────────────────────────────────────
// GitHub API Client for JSON file management
// ─────────────────────────────────────────────
import type { GitHubFileResponse } from "@/types/admin";

const GITHUB_TOKEN = (process.env.GITHUB_TOKEN || "").trim().replace(/['"\r\n]/g, "");
const GITHUB_OWNER = (process.env.NEXT_PUBLIC_GITHUB_OWNER || "").trim().replace(/['"\r\n]/g, "");
const GITHUB_REPO  = (process.env.NEXT_PUBLIC_GITHUB_REPO || "").trim().replace(/['"\r\n]/g, "");

function ghHeaders() {
  return {
    Authorization: `token ${GITHUB_TOKEN}`,
    Accept: "application/vnd.github.v3+json",
    "Content-Type": "application/json",
  };
}

/** Get a file from the repo and return its content + SHA */
export async function getGitHubFile(path: string): Promise<{ content: unknown; sha: string } | null> {
  if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
    return null;
  }
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s read timeout
  try {
    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`,
      {
        headers: ghHeaders(),
        signal: controller.signal,
      }
    );
    if (!res.ok) return null;
    const file = await res.json() as GitHubFileResponse;
    const decoded = JSON.parse(Buffer.from(file.content, "base64").toString("utf-8"));
    return { content: decoded, sha: file.sha };
  } catch (e) {
    console.error("getGitHubFile:", e);
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

/** Update a file in the repo */
export async function updateGitHubFile(
  path: string,
  content: unknown,
  sha: string,
  commitMessage: string
): Promise<boolean> {
  if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
    return false;
  }
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s write timeout
  try {
    const encoded = Buffer.from(JSON.stringify(content, null, 2)).toString("base64");
    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`,
      {
        method: "PUT",
        headers: ghHeaders(),
        body: JSON.stringify({
          message: commitMessage,
          content: encoded,
          sha,
        }),
        signal: controller.signal,
      }
    );
    return res.ok;
  } catch (e) {
    console.error("updateGitHubFile:", e);
    return false;
  } finally {
    clearTimeout(timeoutId);
  }
}
