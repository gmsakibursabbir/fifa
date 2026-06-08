"use client";

import useSWR from "swr";
import type { Match } from "@/types/football";
import type { FilterStatus } from "@/types/football";

const fetcher = (url: string) => fetch(url).then((r) => r.json()) as Promise<Match[]>;

export function useMatches(filter: FilterStatus = "TODAY") {
  const actionMap: Record<FilterStatus, string> = {
    LIVE:     "live",
    TODAY:    "today",
    FINISHED: "status&status=FINISHED",
    UPCOMING: "upcoming",
  };

  const action = actionMap[filter];
  const { data, error, isLoading, mutate } = useSWR<Match[]>(
    `/api/football?action=${action}`,
    fetcher,
    {
      refreshInterval: filter === "LIVE" || filter === "TODAY" ? 10000 : 30000, // 10s for active, 30s for finished/upcoming
      revalidateOnFocus: true,
      dedupingInterval: 5000,
    }
  );

  return {
    matches: data || [],
    isLoading,
    isError: !!error,
    refresh: mutate,
  };
}

export function useMatchDetail(id: string) {
  const { data, error, isLoading } = useSWR<Match>(
    id ? `/api/football?action=match&id=${id}` : null,
    (url: string) => fetch(url).then((r) => r.json()) as Promise<Match>,
    { refreshInterval: 10000 } // 10s refresh for detail view
  );

  return { match: data || null, isLoading, isError: !!error };
}

export function useLiveMatches() {
  const { data, error, isLoading, mutate } = useSWR<Match[]>(
    "/api/football?action=live",
    fetcher,
    {
      refreshInterval: 10000, // 10s refresh
      revalidateOnFocus: true,
    }
  );

  return {
    liveMatches: data || [],
    isLoading,
    isError: !!error,
    refresh: mutate,
  };
}

export function useUpcomingMatches() {
  const { data, isLoading } = useSWR<Match[]>(
    "/api/football?action=upcoming",
    fetcher,
    { refreshInterval: 60000 } // 1 min refresh for upcoming
  );

  return { upcomingMatches: data || [], isLoading };
}
