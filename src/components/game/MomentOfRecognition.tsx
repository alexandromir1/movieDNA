"use client";

import { useState } from "react";

import { analytics } from "@/analytics";
import { REVEAL_REGION_COUNT } from "@/config/economy";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { cn } from "@/lib/utils/cn";

interface MomentOfRecognitionProps {
  challengeId: string;
  className?: string;
}

/**
 * Самоотчёт после игры: на каком регионе впервые «узнал» фильм.
 * Продуктовая метрика moment_of_recognition.
 */
export function MomentOfRecognition({
  challengeId,
  className,
}: MomentOfRecognitionProps) {
  const { t } = useLocale();
  const [answered, setAnswered] = useState(false);

  function submit(regionIndex: number | null) {
    if (answered) return;
    setAnswered(true);
    analytics.track("moment_of_recognition", {
      challengeId,
      regionIndex,
      answer: regionIndex == null ? "never" : "region",
    });
  }

  if (answered) {
    return (
      <p
        className={cn(
          "relative z-[1] mt-5 text-center text-sm text-white/45",
          className,
        )}
      >
        {t("result.momentThanks")}
      </p>
    );
  }

  return (
    <div
      className={cn(
        "relative z-[1] mt-5 rounded-[14px] border border-white/[0.1] bg-white/[0.03] px-4 py-4 text-left",
        className,
      )}
    >
      <p className="text-sm font-medium text-white/90">
        {t("result.momentTitle")}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {Array.from({ length: REVEAL_REGION_COUNT }, (_, index) => {
          const regionIndex = index + 1;
          return (
            <button
              key={regionIndex}
              type="button"
              onClick={() => submit(regionIndex)}
              className="rounded-[10px] border border-white/[0.12] bg-white/[0.05] px-3 py-2 text-sm font-medium text-white/85 transition-colors hover:bg-white/[0.1]"
            >
              {t("result.momentRegion", { n: regionIndex })}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={() => submit(null)}
        className="mt-2.5 text-xs text-white/40 underline-offset-2 hover:text-white/65 hover:underline"
      >
        {t("result.momentNever")}
      </button>
    </div>
  );
}
