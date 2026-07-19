import type { Locale } from "@/lib/i18n/types";

export type PluralForm = "one" | "few" | "many";

/** Russian-style plural category; English uses one vs many (few unused). */
export function pluralForm(count: number, locale: Locale = "ru"): PluralForm {
  const n = Math.abs(count);
  if (locale === "en") {
    return n === 1 ? "one" : "many";
  }
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "one";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return "few";
  return "many";
}
