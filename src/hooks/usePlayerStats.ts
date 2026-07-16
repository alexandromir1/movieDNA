"use client";

import { useCallback, useEffect, useState } from "react";

import { loadPlayerStats } from "@/lib/game/stats";

import type { PlayerStats } from "@/types/stats";

export function usePlayerStats() {
  const [stats, setStats] = useState<PlayerStats>(() => loadPlayerStats());

  const refresh = useCallback(() => {
    setStats(loadPlayerStats());
  }, []);

  useEffect(() => {
    refresh();

    function handleStorage(event: StorageEvent) {
      if (event.key === "kinoshka-stats" || event.key?.startsWith("kinoshka-game:")) {
        refresh();
      }
    }

    window.addEventListener("storage", handleStorage);
    window.addEventListener("kinoshka:stats-updated", refresh);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("kinoshka:stats-updated", refresh);
    };
  }, [refresh]);

  return { stats, refresh };
}
