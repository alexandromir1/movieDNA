"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { V2Atmosphere } from "@/components/v2/V2Atmosphere";
import { V2Button } from "@/components/v2/V2Button";
import { V2DeskShelf } from "@/components/v2/V2DeskShelf";
import { V2_ROUTES } from "@/lib/game/constants";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import {
  beginFirstDeferredPlay,
  campaignHasDeferred,
  getDeferredCount,
} from "@/lib/v2/app";

/**
 * Атмосферное завершение основной кампании.
 */
export function V2CampaignCompleteView() {
  const { t } = useLocale();
  const router = useRouter();
  const [hasDeferred, setHasDeferred] = useState(false);
  const [deferredCount, setDeferredCount] = useState(0);
  const [opening, setOpening] = useState(false);

  useEffect(() => {
    setHasDeferred(campaignHasDeferred());
    setDeferredCount(getDeferredCount());
  }, []);

  function openDeferred() {
    if (opening) return;
    setOpening(true);
    if (!beginFirstDeferredPlay()) {
      setOpening(false);
      router.push(V2_ROUTES.archive);
      return;
    }
    router.push(V2_ROUTES.game);
  }

  return (
    <div className="v2-shell v2-desk-cabinet relative flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden">
      <V2Atmosphere intensity="rich" className="v2-desk-atmosphere" />
      <div className="v2-desk-living-light" aria-hidden />
      <V2DeskShelf
        showArchive
        className="pt-[max(0.15rem,env(safe-area-inset-top))]"
      />
      <div className="v2-screen-enter relative z-10 mx-auto flex min-h-0 w-full max-w-lg flex-1 flex-col px-4 pb-10">
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--v2-accent)]">
            {t("v2.complete.mainArchive")}
          </p>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-[var(--v2-ink)] sm:text-3xl">
            {t("v2.complete.title")}
          </h1>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-[var(--v2-ink-muted)]">
            {t("v2.complete.body")}
          </p>

          {hasDeferred ? (
            <div className="v2-complete-folder mt-8 w-full max-w-xs px-5 py-6">
              <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-[rgb(210_190_160/0.5)]">
                {t("v2.complete.deferredNote")}
              </p>
              <p className="mt-2 text-sm text-[var(--v2-ink-muted)]">
                {t("v2.complete.deferredRemaining", { n: deferredCount })}
              </p>
            </div>
          ) : null}

          <div className="mt-8 flex w-full max-w-xs flex-col gap-3">
            {hasDeferred ? (
              <V2Button
                type="button"
                className="h-11 w-full normal-case tracking-[0.12em]"
                disabled={opening}
                onClick={openDeferred}
              >
                {t("v2.complete.returnDeferred")}
              </V2Button>
            ) : null}
            <Link href={V2_ROUTES.archive} className="block w-full">
              <V2Button
                type="button"
                variant={hasDeferred ? "secondary" : "primary"}
                className="h-11 w-full normal-case tracking-[0.12em]"
              >
                {t("v2.complete.openArchive")}
              </V2Button>
            </Link>
            <Link
              href={V2_ROUTES.home}
              className="text-sm text-[var(--v2-ink-faint)] underline-offset-2 hover:text-[var(--v2-ink-muted)] hover:underline"
            >
              {t("v2.complete.backHome")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
