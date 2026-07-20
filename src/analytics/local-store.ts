import type { AnalyticsEventName, AnalyticsProperties } from "./events";

const STORAGE_KEY = "moviedna-analytics-events";
const MAX_EVENTS = 3000;

export interface StoredAnalyticsEvent {
  name: AnalyticsEventName | string;
  properties: AnalyticsProperties;
  at: string;
}

function readRaw(): StoredAnalyticsEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredAnalyticsEvent[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeRaw(events: StoredAnalyticsEvent[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    window.dispatchEvent(new Event("moviedna:analytics-log-updated"));
  } catch {
    // quota / private mode
  }
}

/** Зеркало каждого track() для внутреннего dashboard. */
export function appendAnalyticsEvent(
  name: AnalyticsEventName,
  properties: AnalyticsProperties,
): void {
  if (typeof window === "undefined") return;
  const next = [
    ...readRaw(),
    {
      name,
      properties: { ...properties },
      at: new Date().toISOString(),
    },
  ];
  if (next.length > MAX_EVENTS) {
    writeRaw(next.slice(next.length - MAX_EVENTS));
    return;
  }
  writeRaw(next);
}

export function loadAnalyticsEventLog(): StoredAnalyticsEvent[] {
  return readRaw();
}

export function clearAnalyticsEventLog(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event("moviedna:analytics-log-updated"));
}

export function countAnalyticsEvents(): number {
  return readRaw().length;
}
