"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { V2BrandLink } from "@/components/v2/V2BrandLink";
import { V2_ROUTES } from "@/lib/game/constants";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { cn } from "@/lib/utils/cn";

interface V2DeskShelfProps {
  showArchive?: boolean;
  /** Центр полки (например, номер дела) — опционально. */
  center?: ReactNode;
  className?: string;
}

/**
 * Деревянная полка кабинета — общая для Home / Game / Archive.
 * MovieDNA · (center) · Архив · язык.
 */
export function V2DeskShelf({
  showArchive = true,
  center,
  className,
}: V2DeskShelfProps) {
  const { t } = useLocale();

  return (
    <header
      className={cn("v2-desk-shelf relative z-20 shrink-0", className)}
      aria-label={t("v2.firstRun.shelfAria")}
    >
      <div className="v2-desk-shelf-lip" aria-hidden />
      <div className="v2-desk-shelf-board relative flex items-center gap-2 px-3 py-2 sm:gap-3 sm:px-5 sm:py-2.5">
        <div className="flex min-w-0 flex-1 items-center">
          <V2BrandLink
            markSize={{ mobile: 20, desktop: 24 }}
            wordmarkClassName="text-[11px] sm:text-[12px]"
          />
        </div>

        {center ? (
          <div className="flex min-w-0 flex-[1.2] flex-col items-center justify-center text-center">
            {center}
          </div>
        ) : (
          <div className="flex-[1.2]" aria-hidden />
        )}

        <div className="flex flex-1 items-center justify-end gap-2 sm:gap-2.5">
          {showArchive ? (
            <Link
              href={V2_ROUTES.archive}
              className="v2-desk-archive-tag"
              aria-label={t("v2.game.archiveLink")}
            >
              <span className="v2-desk-archive-tag-pin" aria-hidden />
              <span className="v2-desk-archive-tag-label">
                {t("v2.game.archiveLink")}
              </span>
            </Link>
          ) : null}
          <div className="v2-desk-lang-plate">
            <LanguageSwitcher className="v2-desk-lang-switch" />
          </div>
        </div>
      </div>
    </header>
  );
}
