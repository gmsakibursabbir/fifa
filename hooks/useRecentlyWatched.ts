"use client";

import { useState, useEffect, useCallback } from "react";

const KEY = "fifa-hub-recently-watched";
const MAX = 10;

interface RecentEntry {
  id: number;
  watchedAt: string;
}

export function useRecentlyWatched() {
  const [recent, setRecent] = useState<RecentEntry[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setRecent(JSON.parse(raw) as RecentEntry[]);
    } catch { /* ignore */ }
  }, []);

  const addRecent = useCallback((id: number) => {
    setRecent((prev) => {
      const filtered = prev.filter((r) => r.id !== id);
      const next = [{ id, watchedAt: new Date().toISOString() }, ...filtered].slice(0, MAX);
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const recentIds = recent.map((r) => r.id);

  return { recent, recentIds, addRecent };
}
