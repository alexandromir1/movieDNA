"use client";

import { useEffect } from "react";

import { PERSISTENCE_ENABLED } from "@/config/game";
import { clearStoredStats } from "@/lib/game/player-stats";
import { clearStoredSessions } from "@/lib/game/session-storage";

/**
 * Сбрасывает локальные сохранения, только если persistence выключен в конфиге.
 */
export function PersistenceGuard({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (PERSISTENCE_ENABLED) return;
    clearStoredSessions();
    clearStoredStats();
  }, []);

  return children;
}
