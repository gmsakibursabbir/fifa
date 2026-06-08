"use client";

import useSWR from "swr";
import type { StandingsResponse } from "@/types/football";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch standings: ${res.status}`);
  }
  return res.json() as Promise<StandingsResponse>;
};

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
