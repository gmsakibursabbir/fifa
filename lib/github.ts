// ─────────────────────────────────────────────
// GitHub API Client for JSON file management
// ─────────────────────────────────────────────
import type { GitHubFileResponse } from "@/types/admin";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "";
const GITHUB_OWNER = process.env.NEXT_PUBLIC_GITHUB_OWNER || "";
const GITHUB_REPO  = process.env.NEXT_PUBLIC_GITHUB_REPO || "";

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
  try {
    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`,
      { headers: ghHeaders() }
    );
    if (!res.ok) return null;
    const file = await res.json() as GitHubFileResponse;
    const decoded = JSON.parse(Buffer.from(file.content, "base64").toString("utf-8"));
    return { content: decoded, sha: file.sha };
  } catch (e) {
    console.error("getGitHubFile:", e);
    return null;
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
      }
    );
    return res.ok;
  } catch (e) {
    console.error("updateGitHubFile:", e);
    return false;
  }
}
