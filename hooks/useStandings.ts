"use client";

import useSWR from "swr";
import type { StandingsResponse } from "@/types/football";

const fetcher = (url: string) =>
  fetch(url).then((r) => r.json()) as Promise<StandingsResponse>;

export function useStandings(competition: string = "PL") {
  const { data, error, isLoading, mutate } = useSWR<StandingsResponse>(
    `/api/football?action=standings&competition=${competition}`,
    fetcher,
    {
      refreshInterval: 300000, // 5 min
      revalidateOnFocus: false,
    }
  );

  return {
    standings: data || null,
    table: data?.standings?.[0]?.table || [],
    isLoading,
    error,
    isError: !!error,
    mutate,
  };
}
