"use client";

import { useState, useCallback } from "react";

const ADMIN_TOKEN_KEY = "fifa-admin-token";

export function useAdmin() {
  const [token, setToken] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return sessionStorage.getItem(ADMIN_TOKEN_KEY) || "";
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const isAuthenticated = !!token;

  const login = useCallback(async (password: string): Promise<boolean> => {
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json() as { success?: boolean; token?: string; error?: string };
      if (data.success && data.token) {
        setToken(data.token);
        sessionStorage.setItem(ADMIN_TOKEN_KEY, data.token);
        return true;
      }
      setError(data.error || "Invalid password");
      return false;
    } catch {
      setError("Connection error");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setToken("");
    sessionStorage.removeItem(ADMIN_TOKEN_KEY);
  }, []);

  return { token, isAuthenticated, isLoading, error, login, logout };
}
