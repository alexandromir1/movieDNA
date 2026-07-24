"use client";

import { useLocale } from "@/lib/i18n/LocaleProvider";
import { cn } from "@/lib/utils/cn";

interface V2VerdictStampProps {
  caseNumber: number;
  className?: string;
}

/**
 * Короткий момент «дело закрыто» перед результатом (~500–700 ms).
 */
export function V2VerdictStamp({ caseNumber, className }: V2VerdictStampProps) {
  const { t } = useLocale();
  const caseLabel = String(caseNumber).padStart(3, "0");

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 z-30 flex items-center justify-center",
        className,
      )}
      aria-live="polite"
      role="status"
    >
      <div className="v2-verdict-stamp">
        <p className="v2-verdict-stamp-case">
          {t("v2.result.verdictCase", { n: caseLabel })}
        </p>
        <p className="v2-verdict-stamp-label">{t("v2.result.verdictStamp")}</p>
        <p className="v2-verdict-stamp-mark" aria-hidden>
          ✓
        </p>
      </div>
    </div>
  );
}
