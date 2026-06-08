// ─────────────────────────────────────────────
// Admin Types
// ─────────────────────────────────────────────

export interface AdminSession {
  authenticated: boolean;
  expiresAt?: string;
}

export interface AdminAction {
  type: "create" | "update" | "delete";
  resource: "channel" | "banner" | "featured";
  timestamp: string;
  data?: unknown;
}

export interface GitHubFileResponse {
  sha: string;
  content: string;
  encoding: string;
}

export interface GitHubUpdatePayload {
  message: string;
  content: string;
  sha: string;
}
