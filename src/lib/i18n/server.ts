import { cookies, headers } from "next/headers";

import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE_KEY,
  isLocale,
  type Locale,
} from "@/lib/i18n/types";

/** Серверная локаль: cookie → Accept-Language (en*) → ru */
export async function getRequestLocale(): Promise<Locale> {
  const jar = await cookies();
  const fromCookie = jar.get(LOCALE_COOKIE_KEY)?.value;
  if (isLocale(fromCookie)) return fromCookie;

  const accept = (await headers()).get("accept-language")?.toLowerCase() ?? "";
  const primary = accept.split(",")[0]?.trim() ?? "";
  if (primary.startsWith("en")) return "en";

  return DEFAULT_LOCALE;
}
