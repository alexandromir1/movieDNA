import type { Locale } from "@/lib/i18n/types";
import { en } from "@/locales/en";
import { ru } from "@/locales/ru";

/** Форматирование дат Challenge для UI (UTC YYYY-MM-DD). */

const dict = { ru, en };

function parseUtcDate(date: string): Date {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function monthName(locale: Locale, monthIndex: number): string {
  return dict[locale].dates.months[String(monthIndex) as keyof typeof ru.dates.months];
}

function weekdayShort(locale: Locale, dayIndex: number): string {
  return dict[locale].dates.weekdays[String(dayIndex) as keyof typeof ru.dates.weekdays];
}

/** Полная дата под логотипом (десктоп) */
export function formatHeaderDate(
  date: string = new Date().toISOString().split("T")[0],
  locale: Locale = "ru",
): string {
  const utc = parseUtcDate(date);
  const weekday = weekdayShort(locale, utc.getUTCDay());
  const day = utc.getUTCDate();
  const month = monthName(locale, utc.getUTCMonth());
  const year = utc.getUTCFullYear();
  if (locale === "en") {
    return `${weekday}, ${month} ${day}, ${year}`;
  }
  return `${weekday}, ${day} ${month} ${year}`;
}

/** Компактная дата для мобильной шапки */
export function formatHeaderDateShort(
  date: string = new Date().toISOString().split("T")[0],
  locale: Locale = "ru",
): string {
  const utc = parseUtcDate(date);
  const day = utc.getUTCDate();
  const month = monthName(locale, utc.getUTCMonth());
  if (locale === "en") return `${month} ${day}`;
  return `${day} ${month}`;
}

/** Короткий ярлык: Сегодня / Вчера / 15 июля */
export function formatSidebarDateLabel(
  date: string,
  today: string,
  locale: Locale = "ru",
): string {
  const messages = dict[locale].dates;
  if (date === today) return messages.today;

  const [ty, tm, td] = today.split("-").map(Number);
  const yesterday = new Date(Date.UTC(ty, tm - 1, td - 1))
    .toISOString()
    .split("T")[0];
  if (date === yesterday) return messages.yesterday;

  const utc = parseUtcDate(date);
  const day = utc.getUTCDate();
  const month = monthName(locale, utc.getUTCMonth());
  if (locale === "en") return `${month} ${day}`;
  return `${day} ${month}`;
}
