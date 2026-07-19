"use client";

import { localize, localizeAlternate } from "@/lib/i18n/localize";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import type { LocalizedString } from "@/lib/i18n/types";

/** Основное название + опционально вторая локаль мелким текстом. */
export function MovieTitle({
  title,
  showAlternate = true,
  as: Tag = "h2",
  className,
  alternateClassName,
}: {
  title: LocalizedString;
  showAlternate?: boolean;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  className?: string;
  alternateClassName?: string;
}) {
  const { locale } = useLocale();
  const primary = localize(title, locale);
  const alternate = showAlternate ? localizeAlternate(title, locale) : null;

  return (
    <>
      <Tag className={className}>{primary}</Tag>
      {alternate && (
        <p className={alternateClassName ?? "mt-1.5 text-sm text-white/50"}>
          {alternate}
        </p>
      )}
    </>
  );
}

export function useMovieTitle(title: LocalizedString): {
  primary: string;
  alternate: string | null;
} {
  const { locale } = useLocale();
  return {
    primary: localize(title, locale),
    alternate: localizeAlternate(title, locale),
  };
}
