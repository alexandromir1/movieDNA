"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type CSSProperties } from "react";

import {
  fetchV2ArchiveSnapshot,
  type V2ArchiveSnapshot,
} from "@/actions/v2-archive";
import { V2Atmosphere } from "@/components/v2/V2Atmosphere";
import { V2Button } from "@/components/v2/V2Button";
import { V2DeskShelf } from "@/components/v2/V2DeskShelf";
import { analytics } from "@/analytics";
import { V2_ROUTES } from "@/lib/game/constants";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { beginDeferredPlay } from "@/lib/v2/app";
import {
  caseAnalyticsProps,
  setActiveCase,
  setCaseEntry,
  storeV2Return,
} from "@/lib/v2/case-analytics";
import { movieRecommendationsHref } from "@/lib/v2/related-cases";
import { readProgress } from "@/lib/v2/progress-store";
import { cn } from "@/lib/utils/cn";

function caseLabel(n: number): string {
  return String(n).padStart(3, "0");
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Архив дел — отдельное «помещение».
 * Читает Progress; отложенные открываются через beginDeferredPlay.
 */
export function V2ArchiveView() {
  const { t, locale } = useLocale();
  const router = useRouter();
  const [snapshot, setSnapshot] = useState<V2ArchiveSnapshot | null>(null);
  const [error, setError] = useState(false);
  const [enterStage, setEnterStage] = useState(0);
  const [openingId, setOpeningId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timerCatalog: number | undefined;
    let timerSections: number | undefined;
    const progress = readProgress() ?? {
      currentSequenceIndex: 0,
      deferredLevelIds: [],
    };

    void fetchV2ArchiveSnapshot(progress)
      .then((data) => {
        if (cancelled) return;
        setSnapshot(data);
        if (prefersReducedMotion()) {
          setEnterStage(3);
          return;
        }
        setEnterStage(1);
        timerCatalog = window.setTimeout(() => {
          if (!cancelled) setEnterStage(2);
        }, 220);
        timerSections = window.setTimeout(() => {
          if (!cancelled) setEnterStage(3);
        }, 480);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });

    return () => {
      cancelled = true;
      if (timerCatalog != null) window.clearTimeout(timerCatalog);
      if (timerSections != null) window.clearTimeout(timerSections);
    };
  }, []);

  function openDeferred(levelId: string) {
    if (openingId) return;
    const entry = snapshot?.deferred.find((item) => item.levelId === levelId);
    setCaseEntry({ enteredFrom: "archive", gameMode: "deferred" });
    if (entry) {
      setActiveCase({
        caseNumber: entry.caseNumber,
        gameMode: "deferred",
      });
    }
    analytics.track("archive_case_resumed", {
      ...caseAnalyticsProps(),
      challengeId: levelId,
      caseNumber: entry?.caseNumber,
      gameMode: "deferred",
      enteredFrom: "archive",
    });
    setOpeningId(levelId);
    if (!beginDeferredPlay(levelId)) {
      setOpeningId(null);
      return;
    }
    router.push(V2_ROUTES.game);
  }

  if (error) {
    return (
      <div className="v2-shell relative flex h-full min-h-0 flex-1 flex-col overflow-hidden">
        <V2Atmosphere intensity="soft" />
        <p className="relative z-10 px-4 py-16 text-center text-sm text-[var(--v2-ink-muted)]">
          {t("v2.archive.loadError")}
        </p>
      </div>
    );
  }

  if (!snapshot) {
    return (
      <div className="v2-shell relative flex h-full min-h-0 flex-1 flex-col overflow-hidden">
        <V2Atmosphere intensity="soft" />
        <p className="relative z-10 px-4 py-16 text-center text-sm text-[var(--v2-ink-muted)]">
          …
        </p>
      </div>
    );
  }

  return (
    <div className="v2-shell v2-desk-cabinet relative flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden">
      <V2Atmosphere intensity="rich" className="v2-desk-atmosphere" />
      <div className="v2-desk-living-light" aria-hidden />
      <div
        className={cn(
          "v2-archive-room relative z-10 mx-auto flex h-full w-full max-w-2xl flex-col overflow-y-auto overscroll-contain",
          enterStage >= 1 && "v2-archive-room-enter",
        )}
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <V2DeskShelf
          showArchive={false}
          className="sticky top-0 z-20 pt-[max(0.15rem,env(safe-area-inset-top))]"
          center={
            <>
              <p className="v2-meta-strong text-[9px] font-semibold uppercase sm:text-[10px]">
                {t("v2.archive.title")}
              </p>
              <p className="mt-0.5 text-[8px] font-medium uppercase tracking-[0.16em] text-[rgb(232_210_160/0.72)] sm:text-[9px]">
                {t("v2.archive.miniProgress", {
                  current: snapshot.completedCount,
                })}
              </p>
            </>
          }
        />

        <div className="flex flex-1 flex-col gap-8 px-3 pb-10 pt-4 sm:px-5 sm:pt-6">
          {enterStage >= 2 ? (
            <div className="v2-archive-catalog">
              <p className="text-center text-[9px] font-semibold uppercase tracking-[0.28em] text-[rgb(201_169_110/0.55)]">
                {t("v2.archive.catalogLabel")}
              </p>
              <p className="mt-2 text-center text-sm leading-relaxed text-[var(--v2-ink-muted)]">
                {t("v2.archive.lead")}
              </p>
            </div>
          ) : (
            <div className="h-16" aria-hidden />
          )}

          {snapshot.sequenceComplete && enterStage >= 3 ? (
            <div className="v2-archive-complete-note v2-archive-section-enter px-4 py-4 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--v2-accent)]">
                {t("v2.archive.mainArchive")}
              </p>
              <p className="mt-2 text-sm text-[var(--v2-ink)]">
                {snapshot.hasDeferred
                  ? t("v2.archive.mainArchiveDeferred")
                  : t("v2.archive.mainArchiveBody")}
              </p>
            </div>
          ) : null}

          {enterStage >= 3 ? (
            <>
              <ArchiveSection
                title={t("v2.archive.closedTitle")}
                style={{ "--section-i": 0 } as CSSProperties}
              >
                {snapshot.closed.length === 0 ? (
                  <p className="v2-archive-empty">{t("v2.archive.closedEmpty")}</p>
                ) : (
                  <ul className="v2-archive-rail">
                    {snapshot.closed.map((entry, index) => {
                      const title =
                        locale === "en" ? entry.title.en : entry.title.ru;
                      return (
                        <li
                          key={entry.levelId}
                          className="v2-archive-folder-closed"
                          style={{ "--card-i": index } as CSSProperties}
                        >
                          <div className="v2-archive-folder-cover">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={entry.image}
                              alt=""
                              className="h-full w-full object-cover"
                              draggable={false}
                            />
                          </div>
                          <div className="v2-archive-folder-meta">
                            <p className="v2-archive-folder-num">
                              {t("v2.archive.caseFile", {
                                n: caseLabel(entry.caseNumber),
                              })}
                            </p>
                            <p className="v2-archive-folder-title">{title}</p>
                            <p className="v2-archive-folder-status">
                              {t("v2.archive.statusClosed")}
                            </p>
                            {entry.hasRelated ? (
                              <Link
                                href={movieRecommendationsHref(entry.movieId)}
                                className="mt-1.5 inline-block text-[11px] tracking-[0.04em] text-[var(--v2-accent)] underline-offset-2 hover:underline"
                                onClick={() => {
                                  storeV2Return({ kind: "archive" });
                                  setActiveCase({
                                    caseNumber: entry.caseNumber,
                                    gameMode: "archive",
                                  });
                                  analytics.track("archive_case_opened", {
                                    ...caseAnalyticsProps(),
                                    challengeId: entry.levelId,
                                    movieId: entry.movieId,
                                    caseNumber: entry.caseNumber,
                                    gameMode: "archive",
                                    enteredFrom: "archive",
                                  });
                                  analytics.track("related_cases_clicked", {
                                    ...caseAnalyticsProps(),
                                    challengeId: entry.levelId,
                                    movieId: entry.movieId,
                                    caseNumber: entry.caseNumber,
                                    href: movieRecommendationsHref(entry.movieId),
                                    source: "archive",
                                    gameMode: "archive",
                                    enteredFrom: "archive",
                                  });
                                }}
                              >
                                {t("v2.archive.relatedCases")}
                              </Link>
                            ) : null}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </ArchiveSection>

              <ArchiveSection
                title={t("v2.archive.deferredTitle")}
                style={{ "--section-i": 1 } as CSSProperties}
              >
                {snapshot.deferred.length === 0 ? (
                  <p className="v2-archive-empty">{t("v2.archive.deferredEmpty")}</p>
                ) : (
                  <ul className="v2-archive-rail">
                    {snapshot.deferred.map((entry, index) => (
                      <li
                        key={entry.levelId}
                        className="v2-archive-folder-deferred"
                        style={{ "--card-i": index } as CSSProperties}
                      >
                        <button
                          type="button"
                          disabled={openingId != null}
                          onClick={() => openDeferred(entry.levelId)}
                          className="flex w-full items-center gap-3 text-left"
                        >
                          <div className="v2-archive-folder-cover shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={entry.image}
                              alt=""
                              className="h-full w-full object-cover opacity-80"
                              draggable={false}
                            />
                          </div>
                          <div className="v2-archive-folder-meta min-w-0 flex-1">
                            <p className="v2-archive-folder-num">
                              {t("v2.archive.caseFile", {
                                n: caseLabel(entry.caseNumber),
                              })}
                            </p>
                            <p className="v2-archive-folder-status">
                              {t("v2.archive.statusDeferred")}
                            </p>
                            <p className="mt-1.5 text-[11px] text-[var(--v2-accent)]">
                              {openingId === entry.levelId
                                ? "…"
                                : t("v2.archive.resumeDeferred")}
                            </p>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </ArchiveSection>

              <ArchiveSection
                title={t("v2.archive.classifiedTitle")}
                style={{ "--section-i": 2 } as CSSProperties}
              >
                {snapshot.classified.length === 0 ? (
                  <p className="v2-archive-empty">
                    {t("v2.archive.classifiedEmpty")}
                  </p>
                ) : (
                  <ul className="v2-archive-classified-grid">
                    {snapshot.classified.map((entry, index) => (
                      <li
                        key={entry.caseNumber}
                        className="v2-archive-folder-sealed"
                        style={{ "--card-i": index } as CSSProperties}
                      >
                        <p className="v2-archive-folder-num">
                          {t("v2.archive.caseFile", {
                            n: caseLabel(entry.caseNumber),
                          })}
                        </p>
                        <p className="v2-archive-folder-status">
                          {t("v2.archive.statusClassified")}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </ArchiveSection>
            </>
          ) : null}

          <div
            className={cn(
              "flex flex-col items-center gap-3 pt-2",
              enterStage >= 3 ? "v2-archive-section-enter" : "opacity-0",
            )}
            style={{ "--section-i": 3 } as CSSProperties}
          >
            {!snapshot.sequenceComplete ? (
              <Link href={V2_ROUTES.game} className="w-full max-w-xs">
                <V2Button
                  type="button"
                  className="h-11 w-full normal-case tracking-[0.12em]"
                >
                  {t("v2.archive.returnToCase")}
                </V2Button>
              </Link>
            ) : snapshot.hasDeferred ? (
              <V2Button
                type="button"
                className="h-11 w-full max-w-xs normal-case tracking-[0.12em]"
                disabled={openingId != null}
                onClick={() => {
                  const first = snapshot.deferred[0];
                  if (first) openDeferred(first.levelId);
                }}
              >
                {t("v2.complete.returnDeferred")}
              </V2Button>
            ) : null}
            <Link
              href={V2_ROUTES.home}
              className="text-sm text-[var(--v2-ink-faint)] underline-offset-2 hover:text-[var(--v2-ink-muted)] hover:underline"
            >
              {t("v2.archive.backHome")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function ArchiveSection({
  title,
  children,
  style,
}: {
  title: string;
  children: React.ReactNode;
  style?: CSSProperties;
}) {
  return (
    <section className="v2-archive-section v2-archive-section-enter" style={style}>
      <h2
        className={cn(
          "mb-3 text-[10px] font-semibold uppercase tracking-[0.28em]",
          "text-[rgb(210_190_160/0.55)]",
        )}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}
