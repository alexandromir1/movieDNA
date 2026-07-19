"use client";

import Link from "next/link";

import { GAME_ROUTES } from "@/lib/game/constants";
import { useTranslations } from "@/lib/i18n/LocaleProvider";

export function GameEmptyState() {
  const t = useTranslations();

  return (
    <div className="mx-auto flex min-h-[44vh] w-full max-w-md flex-col items-center justify-center px-2 text-center">
      <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/35">
        Daily Challenge
      </p>
      <h1 className="mt-3 text-xl font-semibold text-white sm:text-2xl">
        {t("game.emptyPreparing")}
      </h1>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/45">
        {t("game.emptyPreparingBody")}
      </p>
      <Link
        href={GAME_ROUTES.archive}
        className="mt-8 inline-flex h-12 w-full max-w-xs items-center justify-center rounded-[10px] bg-[var(--accent)] text-sm font-semibold text-black transition-all duration-200 hover:brightness-105 active:scale-[0.98]"
      >
        {t("game.openArchive")}
      </Link>
      <Link
        href={GAME_ROUTES.profile}
        className="mt-3 text-xs text-white/40 underline-offset-2 hover:text-white/70 hover:underline"
      >
        {t("game.viewProfile")}
      </Link>
    </div>
  );
}
