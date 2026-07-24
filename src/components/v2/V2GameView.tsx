"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";

import { fetchV2LevelBundle } from "@/actions/v2-game";
import { MovieSearchInput } from "@/components/game/MovieSearchInput";
import { V2Atmosphere } from "@/components/v2/V2Atmosphere";
import { V2Button } from "@/components/v2/V2Button";
import { V2CampaignCompleteView } from "@/components/v2/V2CampaignCompleteView";
import { V2CaseBadge, V2LabDecor } from "@/components/v2/V2LabDecor";
import { V2DeskShelf } from "@/components/v2/V2DeskShelf";
import { V2ResultModal } from "@/components/v2/V2ResultModal";
import { V2VerdictStamp } from "@/components/v2/V2VerdictStamp";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import {
  beginOrResumePlay,
  commitLevelSurrender,
  commitLevelVictory,
  deferCurrentCase,
} from "@/lib/v2/app";
import { clearActivePlay } from "@/lib/v2/active-play";
import { closedCaseCount } from "@/lib/v2/progress";
import { readProgress } from "@/lib/v2/progress-store";
import { getSequenceLength } from "@/lib/v2/level-sequence";
import {
  movieHasRecommendations,
  movieRecommendationsHref,
} from "@/lib/v2/related-cases";
import {
  createV2LevelSession,
  sessionCanRevealNext,
  sessionRevealNext,
  sessionSubmitGuess,
  sessionSurrender,
  type V2LevelSession,
} from "@/lib/v2/level-session";
import { cn } from "@/lib/utils/cn";
import type { V2LevelResult } from "@/types/v2-content";

import {
  FragmentsRevealImage,
  V2_FINAL_ASSEMBLE_MS,
  V2_FRAGMENT_REVEAL_MS,
} from "./FragmentsRevealImage";

type BootState =
  | { status: "loading" }
  | { status: "ready" }
  | { status: "complete" }
  | { status: "error" };

type CasePhase = "idle" | "closing" | "between" | "opening";

const VERDICT_STAMP_MS = 560;
const CASE_FILING_MS = 300;
const CASE_CLOSE_MS = 320;
const CASE_BETWEEN_MS = 180;
const CASE_OPEN_MS = 720;

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function FragmentMeters({
  opened,
  total,
}: {
  opened: number;
  total: number;
}) {
  return (
    <div className="flex items-center gap-1" aria-hidden>
      {Array.from({ length: total }, (_, index) => (
        <span
          key={index}
          className={cn(
            "h-1.5 w-1.5 rounded-full border transition-colors duration-300",
            index < opened
              ? "border-[var(--v2-accent)] bg-[var(--v2-accent)]"
              : "border-white/20 bg-transparent",
          )}
        />
      ))}
    </div>
  );
}

/**
 * Игровой стенд v2 — один экран без скролла (mobile first).
 * Результат — модалка поверх, без перехода на /v2/result.
 */
export function V2GameView() {
  const { t } = useLocale();
  const sequenceTotal = getSequenceLength();
  const [boot, setBoot] = useState<BootState>({ status: "loading" });
  const [session, setSession] = useState<V2LevelSession | null>(null);
  const [displayLevel, setDisplayLevel] = useState(1);
  const [guess, setGuess] = useState("");
  const [animatingPieceIndex, setAnimatingPieceIndex] = useState<number | null>(
    null,
  );
  const [uiLocked, setUiLocked] = useState(false);
  const [resultModal, setResultModal] = useState<V2LevelResult | null>(null);
  const [showVerdictStamp, setShowVerdictStamp] = useState(false);
  const [caseFiling, setCaseFiling] = useState(false);
  const [continuing, setContinuing] = useState(false);
  const [casePhase, setCasePhase] = useState<CasePhase>("idle");
  const [playKind, setPlayKind] = useState<"campaign" | "deferred">("campaign");
  const [closedCount, setClosedCount] = useState(0);
  const lockTimerRef = useRef<number | null>(null);
  const stampTimerRef = useRef<number | null>(null);
  const submitGuardRef = useRef(false);
  const bootGenRef = useRef(0);

  const loadCase = useCallback(async (opts?: { fromContinue?: boolean }) => {
    const gen = ++bootGenRef.current;
    const fromContinue = opts?.fromContinue === true;

    if (!fromContinue) {
      setSession(null);
      setBoot({ status: "loading" });
      setCasePhase("idle");
    }

    setResultModal(null);
    setShowVerdictStamp(false);
    setCaseFiling(false);
    setContinuing(false);
    setUiLocked(false);
    setGuess("");
    setAnimatingPieceIndex(null);
    submitGuardRef.current = false;

    const { progress, target } = beginOrResumePlay();
    if (bootGenRef.current === gen) {
      setClosedCount(closedCaseCount(progress));
    }
    if (target.kind === "complete") {
      if (bootGenRef.current === gen) {
        setSession(null);
        setCasePhase("idle");
        setBoot({ status: "complete" });
      }
      return;
    }

    try {
      const bundle = await fetchV2LevelBundle(target.levelId);
      if (bootGenRef.current !== gen) return;

      if (!bundle) {
        setBoot({ status: "error" });
        setCasePhase("idle");
        return;
      }

      if (fromContinue) {
        setCasePhase("opening");
      }

      setSession(createV2LevelSession(bundle.level, bundle.movie));
      setDisplayLevel(target.displayLevel);
      setPlayKind(target.playKind);
      setBoot({ status: "ready" });

      if (fromContinue && !prefersReducedMotion()) {
        window.setTimeout(() => {
          if (bootGenRef.current === gen) {
            setCasePhase("idle");
          }
        }, CASE_OPEN_MS);
      } else {
        setCasePhase("idle");
      }
    } catch {
      if (bootGenRef.current === gen) {
        setBoot({ status: "error" });
        setCasePhase("idle");
      }
    }
  }, []);

  useEffect(() => {
    void loadCase();
    return () => {
      bootGenRef.current += 1;
      if (lockTimerRef.current != null) {
        window.clearTimeout(lockTimerRef.current);
      }
      if (stampTimerRef.current != null) {
        window.clearTimeout(stampTimerRef.current);
      }
    };
  }, [loadCase]);

  async function handleContinue() {
    if (continuing) return;
    setContinuing(true);
    setResultModal(null);
    setShowVerdictStamp(false);
    setCaseFiling(false);
    clearActivePlay();

    if (!prefersReducedMotion()) {
      setCasePhase("closing");
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, CASE_CLOSE_MS);
      });
      setCasePhase("between");
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, CASE_BETWEEN_MS);
      });
    }

    await loadCase({ fromContinue: true });
  }

  if (boot.status === "loading" && !session) {
    return (
      <div className="v2-shell relative h-full min-h-0 w-full flex-1 overflow-hidden">
        <V2Atmosphere intensity="soft" />
        <p className="relative z-10 px-4 py-16 text-center text-sm text-[var(--v2-ink-muted)]">
          …
        </p>
      </div>
    );
  }

  if (boot.status === "error") {
    return (
      <div className="v2-shell relative h-full min-h-0 w-full flex-1 overflow-hidden">
        <V2Atmosphere intensity="soft" />
        <p className="relative z-10 px-4 py-16 text-center text-sm text-[var(--v2-ink-muted)]">
          {t("v2.game.loadError")}
        </p>
      </div>
    );
  }

  if (boot.status === "complete" || !session) {
    return <V2CampaignCompleteView />;
  }

  const { level, revealRuntime } = session;
  const definition = level.revealDefinition;
  const opened = revealRuntime.openedSteps;
  const totalSteps = revealRuntime.totalSteps;
  const modalOpen = resultModal != null;
  const canReveal =
    sessionCanRevealNext(session) &&
    !uiLocked &&
    !modalOpen &&
    !showVerdictStamp &&
    !caseFiling;
  const controlsDisabled =
    uiLocked ||
    modalOpen ||
    showVerdictStamp ||
    caseFiling ||
    casePhase === "closing" ||
    casePhase === "between";
  const caseNumLabel = String(displayLevel).padStart(3, "0");
  const canDefer = playKind === "campaign" && !controlsDisabled;

  function handleGuessSubmit(value: string) {
    if (!session || controlsDisabled || submitGuardRef.current) return;

    const outcome = sessionSubmitGuess(session, value);
    if (outcome.kind === "ignored") return;

    if (outcome.kind === "wrong") {
      setSession(outcome.session);
      return;
    }

    submitGuardRef.current = true;
    setUiLocked(true);
    commitLevelVictory(outcome.result, playKind);
    setSession(outcome.session);
    const progress = readProgress();
    if (progress) setClosedCount(closedCaseCount(progress));

    if (prefersReducedMotion()) {
      setResultModal({ ...outcome.result, outcome: "won" });
      return;
    }

    setShowVerdictStamp(true);
    if (stampTimerRef.current != null) {
      window.clearTimeout(stampTimerRef.current);
    }
    stampTimerRef.current = window.setTimeout(() => {
      setCaseFiling(true);
      stampTimerRef.current = window.setTimeout(() => {
        setShowVerdictStamp(false);
        setCaseFiling(false);
        setResultModal({ ...outcome.result, outcome: "won" });
        stampTimerRef.current = null;
      }, CASE_FILING_MS);
    }, VERDICT_STAMP_MS);
  }

  function handleNextFragment() {
    if (!session || controlsDisabled || !sessionCanRevealNext(session)) return;

    const nextOpened = session.revealRuntime.openedSteps + 1;
    const isLast = nextOpened >= session.revealRuntime.totalSteps;
    setUiLocked(true);
    setAnimatingPieceIndex(nextOpened - 1);
    setSession(sessionRevealNext(session));

    if (lockTimerRef.current != null) {
      window.clearTimeout(lockTimerRef.current);
    }
    lockTimerRef.current = window.setTimeout(
      () => {
        setUiLocked(false);
        setAnimatingPieceIndex(null);
        lockTimerRef.current = null;
      },
      isLast ? V2_FINAL_ASSEMBLE_MS + 80 : V2_FRAGMENT_REVEAL_MS,
    );
  }

  function handleSurrender() {
    if (!session || controlsDisabled || submitGuardRef.current) return;
    const outcome = sessionSurrender(session);
    if (!outcome) return;

    submitGuardRef.current = true;
    setUiLocked(true);
    setSession(outcome.session);

    window.setTimeout(() => {
      commitLevelSurrender(outcome.result, playKind);
      const progress = readProgress();
      if (progress) setClosedCount(closedCaseCount(progress));
      setResultModal(outcome.result);
    }, 700);
  }

  async function handleDefer() {
    if (!canDefer || submitGuardRef.current) return;
    submitGuardRef.current = true;
    setUiLocked(true);

    const next = deferCurrentCase();
    if (!next) {
      submitGuardRef.current = false;
      setUiLocked(false);
      return;
    }

    setClosedCount(closedCaseCount(next));

    if (!prefersReducedMotion()) {
      setCasePhase("closing");
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, CASE_CLOSE_MS);
      });
      setCasePhase("between");
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, CASE_BETWEEN_MS);
      });
    }

    await loadCase({ fromContinue: true });
  }

  const displayOpened =
    session.status === "lost" ? totalSteps : opened;
  const forceComplete = session.status === "lost";
  const allHintsOpen = displayOpened >= totalSteps;
  const canSurrender =
    allHintsOpen && session.status === "active" && !controlsDisabled;

  return (
    <div className="v2-shell v2-desk-cabinet relative flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden">
      <V2Atmosphere intensity="rich" className="v2-desk-atmosphere" />
      <div className="v2-desk-living-light" aria-hidden />
      <V2LabDecor />

      <V2DeskShelf
        className="pt-[max(0.15rem,env(safe-area-inset-top))]"
        center={
          <>
            <p className="v2-meta-strong text-[8px] font-semibold uppercase sm:text-[9px]">
              {t("v2.game.caseProgress", { n: caseNumLabel })}
            </p>
            <p className="mt-0.5 text-[8px] font-medium uppercase tracking-[0.14em] text-[rgb(232_210_160/0.68)] sm:text-[9px]">
              {t("v2.game.closedCount", { n: closedCount })}
              <span className="opacity-50">
                {" "}
                · {t("v2.game.caseProgressSecondary", { total: sequenceTotal })}
              </span>
            </p>
            <div className="mt-0.5 flex items-center gap-1.5">
              <p className="v2-meta text-[7px] uppercase sm:text-[8px]">
                {displayOpened >= totalSteps
                  ? t("v2.game.allFragmentsOpen")
                  : t("v2.game.fragmentsProgress", {
                      opened: displayOpened,
                      total: totalSteps,
                    })}
              </p>
              <FragmentMeters opened={displayOpened} total={totalSteps} />
            </div>
          </>
        }
      />

      <div
        className={cn(
          "v2-game-column relative z-10 mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col",
          "px-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-1.5",
          "sm:max-w-4xl sm:px-5 sm:pb-3 sm:pt-2 lg:max-w-5xl",
        )}
      >
        <div
          className={cn(
            "v2-image-slot relative flex w-full min-h-0 flex-1 items-center justify-center",
            casePhase === "between" && "v2-case-between-slot",
          )}
        >
          <div
            className={cn(
              "v2-open-folder relative",
              casePhase === "closing" && "v2-case-closing",
              casePhase === "between" && "v2-case-between",
              casePhase === "opening" && "v2-case-opening",
              caseFiling && "v2-case-filing",
            )}
            style={
              {
                "--v2-image-ar": String(level.width / level.height),
              } as CSSProperties
            }
          >
            <div className="v2-open-folder-flap" aria-hidden />
            <div
              className="v2-image-frame v2-open-folder-photo relative"
              style={{
                aspectRatio: `${level.width} / ${level.height}`,
              }}
            >
              <V2CaseBadge key={displayLevel} caseNumber={displayLevel} />
              <FragmentsRevealImage
                key={level.id}
                className={cn(
                  "absolute inset-0 h-full w-full",
                  casePhase === "opening" && "v2-case-photo-enter",
                )}
                imageSrc={level.image}
                width={level.width}
                height={level.height}
                pieces={definition.data.pieces}
                openedSteps={displayOpened}
                animatingPieceIndex={animatingPieceIndex}
                forceComplete={forceComplete}
                aria-label={t("v2.game.imageAlt")}
              />
              {showVerdictStamp ? (
                <V2VerdictStamp caseNumber={displayLevel} />
              ) : null}
            </div>
          </div>
        </div>

        {session.lastGuessWrong ? (
          <p
            className="v2-game-gap-y shrink-0 text-center text-xs text-[rgb(210_160_160/0.9)] sm:text-sm"
            role="status"
            aria-live="polite"
          >
            {t("v2.game.wrongGuess")}
          </p>
        ) : null}

        <div
          className={cn(
            "v2-desk-panel v2-protocol-panel v2-game-gap-y relative z-20 shrink-0 px-2 py-1.5 sm:px-3 sm:py-2.5",
            casePhase === "opening" && "v2-desk-case-enter",
            (casePhase === "closing" || casePhase === "between") &&
              "v2-desk-case-exit",
          )}
        >
          <p className="v2-protocol-label mb-1 px-1 text-[8px] font-semibold uppercase tracking-[0.2em] text-[rgb(210_190_160/0.4)] sm:text-[9px]">
            {t("v2.game.protocolLabel")}
          </p>
          <div className="v2-desk-field v2-protocol-compose flex items-stretch gap-2 px-1.5 py-1 sm:px-2.5 sm:py-2">
            <div className="v2-protocol-input min-w-0 flex-1">
              <MovieSearchInput
                value={guess}
                onChange={(next) => {
                  if (controlsDisabled) return;
                  setGuess(next);
                  if (session.lastGuessWrong) {
                    setSession((prev) =>
                      prev ? { ...prev, lastGuessWrong: false } : prev,
                    );
                  }
                }}
                onSubmit={handleGuessSubmit}
                hideSubmitButton
                disabled={controlsDisabled}
                isError={session.lastGuessWrong}
                inputClassName="v2-search-input !py-1.5 sm:!py-2.5"
                placeholder={t("v2.game.searchPlaceholder")}
              />
            </div>
            <V2Button
              type="button"
              variant="primary"
              size="lg"
              className="v2-protocol-verdict h-auto min-h-[2.5rem] shrink-0 self-center px-3 text-[11px] normal-case tracking-[0.06em] sm:min-h-[3rem] sm:min-w-[9.5rem] sm:px-5 sm:text-[13px]"
              disabled={controlsDisabled}
              onClick={() => handleGuessSubmit(guess)}
            >
              {t("v2.game.guessCtaShort")}
            </V2Button>
          </div>

          <div className="v2-protocol-actions mt-1.5 flex flex-col gap-1.5 border-t border-[var(--v2-border-muted)] pt-1.5 sm:mt-2 sm:gap-2 sm:pt-2">
            {!allHintsOpen ? (
              <V2Button
                type="button"
                variant="secondary"
                size="md"
                className={cn(
                  "w-full normal-case tracking-[0.06em]",
                  canReveal && "v2-fragment-cta-glow",
                )}
                disabled={!canReveal}
                onClick={handleNextFragment}
              >
                {t("v2.game.nextFragmentCta")}
              </V2Button>
            ) : (
              <p className="v2-meta text-center text-[10px] uppercase sm:text-[11px]">
                {t("v2.game.allFragmentsOpen")}
              </p>
            )}

            {allHintsOpen ? (
              <button
                type="button"
                disabled={!canSurrender}
                onClick={handleSurrender}
                className={cn(
                  "w-full rounded-[var(--v2-radius)] border border-[var(--v2-border)] bg-[rgb(20_16_12/0.65)]",
                  "px-3 py-2 text-[12px] font-medium tracking-[0.06em] text-[var(--v2-ink-muted)]",
                  "transition-[border-color,color,background] duration-200",
                  "hover:border-[var(--v2-border-strong)] hover:bg-[rgb(28_22_17/0.85)] hover:text-[var(--v2-ink)]",
                  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--v2-focus)]",
                  "disabled:pointer-events-none disabled:opacity-40",
                  "sm:py-2.5 sm:text-[13px]",
                )}
              >
                {t("v2.game.surrenderCta")}
              </button>
            ) : null}

            {playKind === "campaign" ? (
              <button
                type="button"
                disabled={!canDefer}
                onClick={() => {
                  void handleDefer();
                }}
                className={cn(
                  "w-full py-1.5 text-[10px] font-medium uppercase tracking-[0.14em]",
                  "text-[var(--v2-ink-faint)] transition-colors",
                  "hover:text-[var(--v2-ink-muted)]",
                  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--v2-focus)]",
                  "disabled:pointer-events-none disabled:opacity-40",
                )}
              >
                {t("v2.game.deferCta")}
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {resultModal ? (
        <V2ResultModal
          result={resultModal}
          evidenceSrc={level.image}
          evidenceWidth={level.width}
          evidenceHeight={level.height}
          relatedHref={
            movieHasRecommendations(session.movie)
              ? movieRecommendationsHref(session.movie.id)
              : null
          }
          continuing={continuing}
          onContinue={() => {
            void handleContinue();
          }}
        />
      ) : null}
    </div>
  );
}
