"use client";

import { useLocale } from "@/lib/i18n/LocaleProvider";
import { LOCALES, type Locale } from "@/lib/i18n/types";
import { cn } from "@/lib/utils/cn";

export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale, t } = useLocale();

  return (
    <div
      role="group"
      aria-label={t("locale.switchTo")}
      className={cn(
        "inline-flex items-center rounded-md border border-white/[0.1] bg-white/[0.03] p-0.5 text-[11px] font-medium",
        className,
      )}
    >
      {LOCALES.map((code: Locale) => (
        <button
          key={code}
          type="button"
          aria-pressed={locale === code}
          onClick={() => setLocale(code)}
          className={cn(
            "rounded-[5px] px-1.5 py-0.5 transition-colors",
            locale === code
              ? "bg-white/[0.12] text-white"
              : "text-white/45 hover:text-white/80",
          )}
        >
          {t(`locale.${code}` as "locale.ru" | "locale.en")}
        </button>
      ))}
    </div>
  );
}
