import { siteConfig } from "@/config/site";

import { getUtcDateString, isValidDailyDate, getPuzzleNumber } from "./daily";

/** @deprecated используйте getUtcDateString */
export function getTodayDateString(): string {
  return getUtcDateString();
}

export { getUtcDateString, getPuzzleNumber };

/** Проверить, доступен ли архивный пазл */
export function isArchiveDateValid(date: string): boolean {
  return isValidDailyDate(date) && date < getUtcDateString();
}

export function getTodayPuzzleNumber(): number {
  return getPuzzleNumber(getUtcDateString());
}

export { siteConfig };
