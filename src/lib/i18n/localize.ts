import {
  DEFAULT_LOCALE,
  type Locale,
  type LocalizedString,
} from "@/lib/i18n/types";

/**
 * Достаёт строку для локали. Строковый legacy → как есть.
 * Нет перевода → fallback на ru → любое доступное значение.
 */
export function localize(
  value: LocalizedString | string | null | undefined,
  locale: Locale,
  fallback: Locale = DEFAULT_LOCALE,
): string {
  if (value == null) return "";
  if (typeof value === "string") return value;

  const direct = value[locale]?.trim();
  if (direct) return direct;

  const fb = value[fallback]?.trim();
  if (fb) return fb;

  for (const entry of Object.values(value)) {
    if (typeof entry === "string" && entry.trim()) return entry.trim();
  }
  return "";
}

/** Собирает LocalizedString из пары RU/EN (пустой EN = копирует RU). */
export function localized(
  ru: string,
  en?: string | null,
): LocalizedString {
  const ruText = ru.trim();
  const enText = (en ?? "").trim() || ruText;
  return { ru: ruText, en: enText };
}

/** Вторая локаль для подписи «оригинал» под основным названием. */
export function localizeAlternate(
  value: LocalizedString | string | null | undefined,
  locale: Locale,
): string | null {
  if (value == null || typeof value === "string") return null;
  const primary = localize(value, locale);
  const otherLocale: Locale = locale === "ru" ? "en" : "ru";
  const other = localize(value, otherLocale);
  if (!other || other === primary) return null;
  return other;
}
