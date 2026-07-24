"use client";

import { useLocale } from "@/lib/i18n/LocaleProvider";
import { cn } from "@/lib/utils/cn";

interface V2CaseFolderProps {
  caseNumber: number;
  closedCount: number;
  isContinue: boolean;
  opening?: boolean;
  pulseCta?: boolean;
  onStart: () => void;
  className?: string;
}

function caseLabel(n: number): string {
  return String(n).padStart(3, "0");
}

/**
 * Архивная папка на столе — физический объект, герой главного экрана.
 */
export function V2CaseFolder({
  caseNumber,
  closedCount,
  isContinue,
  opening = false,
  pulseCta = false,
  onStart,
  className,
}: V2CaseFolderProps) {
  const { t } = useLocale();
  const n = caseLabel(caseNumber);

  return (
    <div
      className={cn(
        "v2-case-folder-stage relative w-full max-w-[min(100%,30rem)] sm:max-w-[32rem]",
        className,
      )}
    >
      <div className="v2-desk-surface" aria-hidden />

      <div
        className={cn(
          "v2-case-folder relative flex w-full flex-col",
          opening && "v2-case-folder--opening",
        )}
      >
        <div className="v2-case-folder-shadow" aria-hidden />

        <div className="v2-case-folder-tab" aria-hidden>
          <span>{t("v2.firstRun.folderTab")}</span>
        </div>

        <div className="v2-case-folder-body">
          <span className="v2-case-folder-wear v2-case-folder-wear--tl" aria-hidden />
          <span className="v2-case-folder-wear v2-case-folder-wear--br" aria-hidden />

          <div className="v2-case-folder-stamp" aria-hidden>
            {t("v2.firstRun.folderStamp")}
          </div>

          <div className="v2-case-folder-top">
            <p className="v2-case-folder-number">
              {t("v2.firstRun.folderCase", { n })}
            </p>
            <p className="v2-case-folder-unknown">
              {t("v2.firstRun.folderUnknown")}
            </p>
          </div>

          <div className="v2-case-folder-progress">
            <p className="v2-case-folder-progress-title">
              {t("v2.firstRun.folderProgressTitle")}
            </p>
            <ul className="v2-case-folder-progress-list">
              <li>
                {isContinue
                  ? t("v2.firstRun.folderProgressClosed", { n: closedCount })
                  : t("v2.firstRun.folderProgressFragments")}
              </li>
              <li>
                {isContinue
                  ? t("v2.firstRun.folderProgressReady")
                  : t("v2.firstRun.folderProgressHints")}
              </li>
            </ul>
          </div>

          <div className="v2-case-folder-clasp">
            <button
              type="button"
              className={cn(
                "v2-case-folder-cta",
                pulseCta && !opening && "v2-first-run-cta-pulse",
              )}
              disabled={opening}
              onClick={onStart}
            >
              {isContinue
                ? t("v2.firstRun.continueCta")
                : t("v2.firstRun.startCta")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
