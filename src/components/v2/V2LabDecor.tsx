"use client";

import { useLocale } from "@/lib/i18n/LocaleProvider";

/**
 * Физическая бирка поверх улики — аксессуар, не UI-chrome.
 */
export function V2CaseBadge({ caseNumber }: { caseNumber: number }) {
  const { t } = useLocale();
  const caseLabel = String(caseNumber).padStart(3, "0");

  return (
    <div
      className="v2-case-badge pointer-events-none absolute left-2 top-2 z-10 sm:left-2.5 sm:top-2.5"
      aria-hidden
    >
      <div className="v2-case-badge-plate px-1.5 py-1 sm:px-2 sm:py-1.5">
        <p className="text-[7px] font-semibold uppercase tracking-[0.22em] text-[rgb(212_180_120)] sm:text-[8px]">
          {t("v2.game.caseBadge", { n: caseLabel })}
        </p>
      </div>
    </div>
  );
}

/** Тихий фон-декор (архивная шкала). */
export function V2LabDecor() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-[1] overflow-hidden"
      aria-hidden
    >
      <div className="absolute bottom-[26%] right-1.5 top-[20%] hidden w-3 opacity-[0.07] md:block lg:right-3">
        <div className="flex h-full flex-col justify-between border-r border-[var(--v2-accent)]/40 pr-0.5">
          {Array.from({ length: 7 }, (_, i) => (
            <span
              key={i}
              className="block h-px w-1.5 bg-[var(--v2-accent)]/60"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
