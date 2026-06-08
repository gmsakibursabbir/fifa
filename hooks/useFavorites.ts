"use client";

import { useState, useEffect, useCallback } from "react";
import { getFavoritesSet, saveFavoritesSet } from "@/lib/utils";

const KEY = "fifa-hub-favorites";

export function useFavorites() {
  const [favorites, setFavorites] = useState<Set<number>>(new Set());

  useEffect(() => {
    setFavorites(getFavoritesSet(KEY));
  }, []);

  const toggle = useCallback((id: number) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      saveFavoritesSet(KEY, next);
      return next;
    });
  }, []);

  const isFavorite = useCallback(
    (id: number) => favorites.has(id),
    [favorites]
  );

  return { favorites, toggle, isFavorite };
}
