"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { V2Atmosphere } from "@/components/v2/V2Atmosphere";
import { V2CaseFolder } from "@/components/v2/V2CaseFolder";
import { V2DeskShelf } from "@/components/v2/V2DeskShelf";
import { V2_ROUTES } from "@/lib/game/constants";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { getHomeEntry, type HomeEntry } from "@/lib/v2/app";
import { cn } from "@/lib/utils/cn";

const IDLE_HINT_MS = 10_000;
const OPEN_MS = 620;

const DESK_NOTES = [
  {
    titleKey: "v2.firstRun.howDnaTitle" as const,
    bodyKey: "v2.firstRun.howDnaBody" as const,
    tilt: -3.2,
    lift: 4,
  },
  {
    titleKey: "v2.firstRun.howDetectiveTitle" as const,
    bodyKey: "v2.firstRun.howDetectiveBody" as const,
    tilt: 2.1,
    lift: 0,
  },
  {
    titleKey: "v2.firstRun.howUniqueTitle" as const,
    bodyKey: "v2.firstRun.howUniqueBody" as const,
    tilt: -1.6,
    lift: 6,
  },
];

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Кабинет детектива — главный экран v2.
 * Папка на столе; переход в игру = открытие папки (presentation only).
 */
export function V2FirstRunView() {
  const { t } = useLocale();
  const router = useRouter();
  const [pulseCta, setPulseCta] = useState(false);
  const [entry, setEntry] = useState<HomeEntry | null>(null);
  const [opening, setOpening] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    setEntry(getHomeEntry());
    const timer = window.setTimeout(() => setPulseCta(true), IDLE_HINT_MS);
    return () => window.clearTimeout(timer);
  }, []);

  function startInvestigation() {
    if (opening) return;
    if (prefersReducedMotion()) {
      router.push(V2_ROUTES.game);
      return;
    }
    setOpening(true);
    window.setTimeout(() => setLeaving(true), 280);
    window.setTimeout(() => {
      router.push(V2_ROUTES.game);
    }, OPEN_MS);
  }

  const caseNumber = entry?.displayLevel ?? 1;
  const closedCount = entry?.closedCount ?? 0;
  const isContinue = entry?.cta === "continue";
  const showArchive = entry != null;

  return (
    <div
      className={cn(
        "v2-shell v2-desk-cabinet relative flex h-full max-h-full flex-col overflow-hidden",
        leaving && "v2-desk-cabinet--leave",
      )}
    >
      <V2Atmosphere intensity="rich" className="v2-desk-atmosphere" />
      <div className="v2-desk-living-light" aria-hidden />

      <V2DeskShelf
        showArchive={showArchive}
        className="pt-[max(0.15rem,env(safe-area-inset-top))]"
      />

      <div
        className={cn(
          "relative z-10 mx-auto flex min-h-0 w-full max-w-4xl flex-1 flex-col",
          "px-3 pb-[max(0.55rem,env(safe-area-inset-bottom))]",
          "sm:px-8 sm:pb-4",
        )}
      >
        <div className="v2-desk-lead flex shrink-0 flex-col items-center px-3 pt-1 text-center sm:pt-1.5">
          <h1 className="v2-desk-headline max-w-lg text-[1.05rem] font-semibold leading-snug tracking-tight text-[var(--v2-ink)] sm:text-[1.45rem] sm:leading-tight">
            {t("v2.firstRun.headline")}
          </h1>
          <p className="v2-desk-subhead mt-1 max-w-md text-[10px] leading-snug text-[var(--v2-ink-muted)] sm:text-[12px] sm:leading-relaxed">
            {t("v2.firstRun.subhead")}
          </p>
        </div>

        <div className="v2-desk-stage flex min-h-0 flex-1 flex-col items-center">
          <V2CaseFolder
            caseNumber={caseNumber}
            closedCount={closedCount}
            isContinue={isContinue}
            opening={opening}
            pulseCta={pulseCta}
            onStart={startInvestigation}
          />
        </div>

        <div className="v2-desk-notes shrink-0 px-0.5 sm:px-2">
          <ul className="grid grid-cols-3 gap-1.5 sm:gap-3">
            {DESK_NOTES.map((note) => (
              <li
                key={note.titleKey}
                className="v2-desk-note"
                style={{
                  transform: `rotate(${note.tilt}deg) translateY(${note.lift}px)`,
                }}
              >
                <p className="v2-desk-note-title">{t(note.titleKey)}</p>
                <p className="v2-desk-note-body">{t(note.bodyKey)}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
