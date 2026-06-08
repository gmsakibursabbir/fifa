"use client";

import useSWR from "swr";
import { useState, useCallback } from "react";
import type { Channel } from "@/types/channel";

const fetcher = (url: string) =>
  fetch(url).then((r) => r.json()) as Promise<Channel[]>;

export function useChannels() {
  const { data, error, isLoading, mutate } = useSWR<Channel[]>(
    "/api/channels",
    fetcher,
    { revalidateOnFocus: false }
  );

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("All");

  const filtered = (data || []).filter((ch) => {
    const matchSearch =
      !search ||
      ch.name.toLowerCase().includes(search.toLowerCase()) ||
      (ch.description || "").toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "All" || ch.category === category;
    return matchSearch && matchCat;
  });

  const addChannel = useCallback(
    async (channel: Partial<Channel>, adminToken: string) => {
      await fetch("/api/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-token": adminToken },
        body: JSON.stringify(channel),
      });
      mutate();
    },
    [mutate]
  );

  // Bulk insert — sends one request for the whole array
  const addChannels = useCallback(
    async (channels: Partial<Channel>[], adminToken: string) => {
      await fetch("/api/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-token": adminToken },
        body: JSON.stringify(channels),
      });
      mutate();
    },
    [mutate]
  );

  const updateChannel = useCallback(
    async (channel: Channel, adminToken: string) => {
      await fetch("/api/channels", {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-admin-token": adminToken },
        body: JSON.stringify(channel),
      });
      mutate();
    },
    [mutate]
  );

  const deleteChannel = useCallback(
    async (id: number, adminToken: string) => {
      await fetch(`/api/channels?id=${id}`, {
        method: "DELETE",
        headers: { "x-admin-token": adminToken },
      });
      mutate();
    },
    [mutate]
  );

  // Bulk delete — one request for multiple IDs
  const deleteChannels = useCallback(
    async (ids: number[], adminToken: string) => {
      await fetch(`/api/channels?ids=${ids.join(",")}`, {
        method: "DELETE",
        headers: { "x-admin-token": adminToken },
      });
      mutate();
    },
    [mutate]
  );

  // Delete all channels in one request
  const deleteAllChannels = useCallback(
    async (adminToken: string) => {
      await fetch("/api/channels?all=true", {
        method: "DELETE",
        headers: { "x-admin-token": adminToken },
      });
      mutate();
    },
    [mutate]
  );

  return {
    channels: data || [],
    filtered,
    isLoading,
    isError: !!error,
    search,
    setSearch,
    category,
    setCategory,
    addChannel,
    addChannels,
    updateChannel,
    deleteChannel,
    deleteChannels,
    deleteAllChannels,
    mutate,
  };
}
