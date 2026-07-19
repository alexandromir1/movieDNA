"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { GAME_ROUTES } from "@/lib/game/constants";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { pluralForm } from "@/lib/i18n/plural";
import { loadPlayerStats } from "@/lib/game/player-stats";

interface ComeBackTomorrowProps {
  /** Show streak after a Daily win */
  showStreak: boolean;
}

/**
 * Daily result retention cue: streak + explicit reason to return tomorrow.
 */
export function ComeBackTomorrow({ showStreak }: ComeBackTomorrowProps) {
  const { locale, t, messages } = useLocale();
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    setStreak(loadPlayerStats().currentStreak);
  }, []);

  return (
    <div className="mt-5 w-full rounded-[12px] border border-white/[0.09] bg-white/[0.03] px-4 py-4 text-center">
      {showStreak && streak > 0 ? (
        <p className="text-sm text-white">
          <span aria-hidden>🔥</span> {t("result.streakLabel")}:{" "}
          <span className="font-semibold tabular-nums">{streak}</span>{" "}
          {messages.result.dayWord[pluralForm(streak, locale)]}
        </p>
      ) : (
        <p className="text-sm text-white/80">{t("result.tomorrowNewDaily")}</p>
      )}
      <p className="mt-1.5 text-xs leading-relaxed text-white/40">
        {showStreak && streak > 0
          ? t("result.keepStreak")
          : t("result.seeYouTomorrow")}
      </p>
      <Link
        href={GAME_ROUTES.profile}
        className="mt-3 inline-flex text-xs text-white/50 underline-offset-2 hover:text-white/80 hover:underline"
      >
        {t("result.viewProfile")}
      </Link>
    </div>
  );
}
