"use client";

import { useEffect } from "react";

import { PERSISTENCE_ENABLED } from "@/config/game";
import { clearStoredStats } from "@/lib/game/player-stats";
import { clearStoredSessions } from "@/lib/game/session-storage";

/**
 * TODO: удалить после включения PERSISTENCE_ENABLED.
 * В тестовом режиме сбрасывает локальные сохранения при загрузке.
 */
export function PersistenceGuard({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (PERSISTENCE_ENABLED) return;
    clearStoredSessions();
    clearStoredStats();
  }, []);

  return children;
}
