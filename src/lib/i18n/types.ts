/**
 * Поддерживаемые локали. Чтобы добавить язык: расширь union и создай locales/{code}.ts
 */
export type Locale = "ru" | "en";

export const LOCALES: readonly Locale[] = ["ru", "en"] as const;

/** Источник правды для контента, если перевод ещё не заполнен */
export const DEFAULT_LOCALE: Locale = "ru";

export const LOCALE_STORAGE_KEY = "moviedna-locale";
export const LOCALE_COOKIE_KEY = "moviedna-locale";

/**
 * Текстовое поле контента. При добавлении локали — дополни ключ во всех JSON.
 * Чтение всегда через `localize()`.
 */
export type LocalizedString = Record<Locale, string>;

export function isLocale(value: unknown): value is Locale {
  return value === "ru" || value === "en";
}
