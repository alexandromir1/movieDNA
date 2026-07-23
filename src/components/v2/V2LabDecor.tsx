"use client";

import { useLocale } from "@/lib/i18n/LocaleProvider";

/**
 * Архивная карточка-аксессуар поверх улики.
 * Не конкурирует с изображением.
 */
export function V2CaseBadge({ caseNumber }: { caseNumber: number }) {
  const { t } = useLocale();
  const caseLabel = String(caseNumber).padStart(3, "0");

  return (
    <div
      className="pointer-events-none absolute left-2 top-2 z-10 opacity-65 sm:left-2.5 sm:top-2.5"
      aria-hidden
    >
      <div className="-rotate-1 rounded-[1px] border border-[var(--v2-accent)]/30 bg-[rgb(15_11_8/0.7)] px-1.5 py-1 shadow-[0_4px_14px_rgb(0_0_0/0.4)] backdrop-blur-[2px] sm:px-2 sm:py-1.5">
        <p className="text-[7px] font-semibold uppercase tracking-[0.2em] text-[var(--v2-accent)] sm:text-[8px]">
          {t("v2.game.caseBadge", { n: caseLabel })}
        </p>
      </div>
    </div>
  );
}

/** Тихий фон-декор (шкала). */
export function V2LabDecor() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-[1] overflow-hidden"
      aria-hidden
    >
      <div className="absolute bottom-[26%] right-1.5 top-[20%] hidden w-3 opacity-[0.08] md:block lg:right-3">
        <div className="flex h-full flex-col justify-between border-r border-[var(--v2-accent)]/50 pr-0.5">
          {Array.from({ length: 7 }, (_, i) => (
            <span
              key={i}
              className="block h-px w-1.5 bg-[var(--v2-accent)]/70"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
