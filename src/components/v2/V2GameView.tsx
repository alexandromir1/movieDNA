"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";

import { fetchV2LevelBundle } from "@/actions/v2-game";
import { MovieSearchInput } from "@/components/game/MovieSearchInput";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { V2Atmosphere } from "@/components/v2/V2Atmosphere";
import { V2BrandLink } from "@/components/v2/V2BrandLink";
import { V2Button } from "@/components/v2/V2Button";
import { V2CaseBadge, V2LabDecor } from "@/components/v2/V2LabDecor";
import { V2ResultModal } from "@/components/v2/V2ResultModal";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import {
  beginOrResumePlay,
  commitLevelSurrender,
  commitLevelVictory,
} from "@/lib/v2/app";
import { getSequenceLength } from "@/lib/v2/level-sequence";
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
  V2_FRAGMENT_REVEAL_MS,
} from "./FragmentsRevealImage";

type BootState =
  | { status: "loading" }
  | { status: "ready" }
  | { status: "complete" }
  | { status: "error" };

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
  const [continuing, setContinuing] = useState(false);
  const lockTimerRef = useRef<number | null>(null);
  const submitGuardRef = useRef(false);
  const bootGenRef = useRef(0);

  const loadCase = useCallback(async () => {
    const gen = ++bootGenRef.current;
    // Сразу убираем прошлую сессию — иначе ~1с висит старый кадр.
    setSession(null);
    setBoot({ status: "loading" });
    setResultModal(null);
    setContinuing(false);
    setUiLocked(false);
    setGuess("");
    setAnimatingPieceIndex(null);
    submitGuardRef.current = false;

    const { target } = beginOrResumePlay();
    if (target.kind === "complete") {
      if (bootGenRef.current === gen) {
        setBoot({ status: "complete" });
      }
      return;
    }

    try {
      const bundle = await fetchV2LevelBundle(target.levelId);
      if (bootGenRef.current !== gen) return;

      if (!bundle) {
        setBoot({ status: "error" });
        return;
      }

      setSession(createV2LevelSession(bundle.level, bundle.movie));
      setDisplayLevel(target.displayLevel);
      setBoot({ status: "ready" });
    } catch {
      if (bootGenRef.current === gen) {
        setBoot({ status: "error" });
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
    };
  }, [loadCase]);

  async function handleContinue() {
    if (continuing) return;
    setContinuing(true);
    await loadCase();
  }

  if (boot.status === "loading" && !session) {
    return (
      <div className="v2-shell relative h-full overflow-hidden">
        <V2Atmosphere intensity="soft" />
        <p className="relative z-10 px-4 py-16 text-center text-sm text-[var(--v2-ink-muted)]">
          …
        </p>
      </div>
    );
  }

  if (boot.status === "error") {
    return (
      <div className="v2-shell relative h-full overflow-hidden">
        <V2Atmosphere intensity="soft" />
        <p className="relative z-10 px-4 py-16 text-center text-sm text-[var(--v2-ink-muted)]">
          {t("v2.game.loadError")}
        </p>
      </div>
    );
  }

  if (boot.status === "complete" || !session) {
    return (
      <div className="v2-shell relative h-full overflow-hidden">
        <V2Atmosphere intensity="soft" />
        <div className="v2-screen-enter relative z-10 mx-auto flex h-full max-w-lg flex-col justify-center px-4 text-center">
          <h1 className="text-2xl font-semibold text-[var(--v2-ink)]">
            {t("v2.game.sequenceCompleteTitle")}
          </h1>
          <p className="mt-3 text-sm text-[var(--v2-ink-muted)]">
            {t("v2.game.sequenceCompleteBody")}
          </p>
        </div>
      </div>
    );
  }

  const { level, revealRuntime } = session;
  const definition = level.revealDefinition;
  const opened = revealRuntime.openedSteps;
  const totalSteps = revealRuntime.totalSteps;
  const modalOpen = resultModal != null;
  const canReveal =
    sessionCanRevealNext(session) && !uiLocked && !modalOpen;
  const controlsDisabled = uiLocked || modalOpen;

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
    commitLevelVictory(outcome.result);
    setSession(outcome.session);
    setResultModal({ ...outcome.result, outcome: "won" });
  }

  function handleNextFragment() {
    if (!session || controlsDisabled || !sessionCanRevealNext(session)) return;

    const nextOpened = session.revealRuntime.openedSteps + 1;
    setUiLocked(true);
    setAnimatingPieceIndex(nextOpened - 1);
    setSession(sessionRevealNext(session));

    if (lockTimerRef.current != null) {
      window.clearTimeout(lockTimerRef.current);
    }
    lockTimerRef.current = window.setTimeout(() => {
      setUiLocked(false);
      setAnimatingPieceIndex(null);
      lockTimerRef.current = null;
    }, V2_FRAGMENT_REVEAL_MS);
  }

  function handleSurrender() {
    if (!session || controlsDisabled || submitGuardRef.current) return;
    const outcome = sessionSurrender(session);
    if (!outcome) return;

    submitGuardRef.current = true;
    setUiLocked(true);
    setSession(outcome.session);

    window.setTimeout(() => {
      commitLevelSurrender(outcome.result);
      setResultModal(outcome.result);
    }, 700);
  }

  const displayOpened =
    session.status === "lost" ? totalSteps : opened;
  const forceComplete = session.status === "lost";
  const allHintsOpen = displayOpened >= totalSteps;
  const canSurrender =
    allHintsOpen && session.status === "active" && !controlsDisabled;

  return (
    <div className="v2-shell relative flex h-full max-h-full w-full flex-col overflow-hidden">
      <V2Atmosphere intensity="soft" />
      <V2LabDecor />

      <div
        className={cn(
          "v2-game-column relative z-10 mx-auto flex h-full w-full max-w-3xl flex-col",
          "px-2.5 pt-[max(0.35rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))]",
          "sm:max-w-4xl sm:px-5 sm:pb-3 sm:pt-3 lg:max-w-5xl",
        )}
      >
        <header className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <div className="flex min-w-0 flex-1 items-center">
            <V2BrandLink markSize={{ mobile: 22, desktop: 26 }} />
          </div>

          <div className="flex min-w-0 flex-[1.4] flex-col items-center gap-0.5 text-center">
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[var(--v2-ink)] sm:text-[10px]">
              {t("v2.game.caseProgress", {
                current: displayLevel,
                total: sequenceTotal,
              })}
            </p>
            <div className="flex items-center gap-2">
              <p className="text-[8px] uppercase tracking-[0.14em] text-[var(--v2-ink-muted)] sm:text-[9px]">
                {displayOpened >= totalSteps
                  ? t("v2.game.allFragmentsOpen")
                  : t("v2.game.fragmentsProgress", {
                      opened: displayOpened,
                      total: totalSteps,
                    })}
              </p>
              <FragmentMeters opened={displayOpened} total={totalSteps} />
            </div>
          </div>

          <div className="flex flex-1 justify-end">
            <LanguageSwitcher className="scale-90 border-[var(--v2-border-muted)] bg-black/30 sm:scale-100" />
          </div>
        </header>

        {/*
          Mobile: Header/Desk почти фиксированы; flex-1 отдаёт свободную
          высоту кадру (max-contain). Зазоры — clamp/vh. Desktop — витрина.
        */}
        <div className="v2-image-slot relative flex w-full min-h-0 flex-1 items-center justify-center">
          <div
            className="v2-image-frame relative"
            style={
              {
                aspectRatio: `${level.width} / ${level.height}`,
                "--v2-image-ar": String(level.width / level.height),
              } as CSSProperties
            }
          >
            <V2CaseBadge caseNumber={displayLevel} />
            <FragmentsRevealImage
              key={level.id}
              className="absolute inset-0 h-full w-full"
              imageSrc={level.image}
              width={level.width}
              height={level.height}
              pieces={definition.data.pieces}
              openedSteps={displayOpened}
              animatingPieceIndex={animatingPieceIndex}
              forceComplete={forceComplete}
              aria-label={t("v2.game.imageAlt")}
            />
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

        <div className="v2-desk-panel v2-game-gap-y relative z-20 shrink-0 px-2 py-1.5 sm:px-3 sm:py-2.5">
          <div className="v2-desk-field flex items-stretch gap-2 px-1.5 py-1 sm:px-2.5 sm:py-2">
            <div className="min-w-0 flex-1">
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
              className="h-auto min-h-[2.5rem] shrink-0 self-center px-4 text-[13px] tracking-[0.1em] sm:min-h-[3rem] sm:min-w-[8.5rem] sm:px-7 sm:text-[14px]"
              disabled={controlsDisabled}
              onClick={() => handleGuessSubmit(guess)}
            >
              {t("v2.game.guessCtaShort")}
            </V2Button>
          </div>

          <div className="mt-1.5 flex flex-col gap-1.5 border-t border-[var(--v2-border-muted)] pt-1.5 sm:mt-2 sm:gap-2 sm:pt-2">
            {!allHintsOpen ? (
              <V2Button
                type="button"
                variant="secondary"
                size="md"
                className={cn(
                  "w-full normal-case tracking-[0.08em]",
                  canReveal && "v2-fragment-cta-glow",
                )}
                disabled={!canReveal}
                onClick={handleNextFragment}
              >
                {t("v2.game.nextFragmentCta")}
              </V2Button>
            ) : (
              <p className="text-center text-[10px] uppercase tracking-[0.14em] text-[var(--v2-ink-faint)] sm:text-[11px]">
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
          </div>
        </div>
      </div>

      {resultModal ? (
        <V2ResultModal
          result={resultModal}
          continuing={continuing}
          onContinue={() => {
            void handleContinue();
          }}
        />
      ) : null}
    </div>
  );
}
