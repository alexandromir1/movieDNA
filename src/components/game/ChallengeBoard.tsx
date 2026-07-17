"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

import { ProgressiveRevealImage } from "@/components/ProgressiveRevealImage";
import { MovieSearchInput } from "@/components/game/MovieSearchInput";
import { Button } from "@/components/ui/Button";
import { REVEAL_REGION_COUNT } from "@/config/economy";
import { FEEDBACK_MESSAGE_MS, WRONG_GUESS_FEEDBACK_MS } from "@/config/game";
import { useChallenge } from "@/hooks/useChallenge";
import { GAME_ROUTES } from "@/lib/game/constants";
import { shareChallengeResult } from "@/lib/game/share-result";
import { cn } from "@/lib/utils/cn";

import type { Challenge, Level, Movie } from "@/types/content";
import type { RevealRegion as ViewerRegion } from "@/types/reveal-image";

interface ChallengeBoardProps {
  challenge: Challenge;
  level: Level;
  movie: Movie;
}

function formatElapsed(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs} с`;
  return `${mins} м ${secs} с`;
}

function triggerWrongGuessVibration() {
  if (
    typeof navigator !== "undefined" &&
    typeof navigator.vibrate === "function"
  ) {
    navigator.vibrate(20);
  }
}

/** Детерминированные конфетти: без Math.random в render */
const CONFETTI_PIECES = Array.from({ length: 32 }, (_, index) => ({
  left: (index * 37 + 11) % 100,
  delay: ((index * 13) % 10) / 10,
  duration: 2.2 + ((index * 7) % 12) / 10,
  color:
    index % 4 === 0
      ? "#F4C53F"
      : index % 4 === 1
        ? "#ffffff"
        : index % 4 === 2
          ? "#6ee7b7"
          : "#f4c53f99",
  rotate: (index * 53) % 360,
}));

function ConfettiOverlay() {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 z-10 h-full overflow-hidden"
      aria-hidden="true"
    >
      {CONFETTI_PIECES.map((piece, index) => (
        <span
          key={index}
          className="confetti-piece"
          style={
            {
              left: `${piece.left}%`,
              backgroundColor: piece.color,
              transform: `rotate(${piece.rotate}deg)`,
              "--confetti-delay": `${piece.delay}s`,
              "--confetti-duration": `${piece.duration}s`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

function TrophyIcon() {
  return (
    <svg
      width="64"
      height="64"
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      className="result-icon-pop mx-auto"
    >
      <circle cx="32" cy="32" r="32" fill="#F4C53F" fillOpacity="0.12" />
      <path
        d="M22 16h20v6a10 10 0 0 1-20 0v-6z"
        fill="#F4C53F"
      />
      <path
        d="M22 18h-5a1 1 0 0 0-1 1c0 5 2.8 8.4 7 9.4M42 18h5a1 1 0 0 1 1 1c0 5-2.8 8.4-7 9.4"
        stroke="#F4C53F"
        strokeWidth="2.4"
        strokeLinecap="round"
        fill="none"
      />
      <path d="M30 32h4v6h-4z" fill="#F4C53F" />
      <path d="M25 40h14a1 1 0 0 1 1 1v4H24v-4a1 1 0 0 1 1-1z" fill="#F4C53F" />
    </svg>
  );
}

function LoseIcon() {
  return (
    <svg
      width="64"
      height="64"
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      className="result-icon-pop mx-auto"
    >
      <circle cx="32" cy="32" r="32" fill="#FB7185" fillOpacity="0.1" />
      <circle
        cx="32"
        cy="32"
        r="20"
        stroke="#FB7185"
        strokeOpacity="0.7"
        strokeWidth="2.5"
      />
      <path
        d="M25 25l14 14M39 25L25 39"
        stroke="#FB7185"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Кадр Challenge в фиксированном «окне» viewport:
 * на мобилке ниже — чтобы поле ввода и кнопки оставались на экране.
 */
function ChallengeImageFrame({
  width,
  height,
  compact = false,
  className,
  children,
}: {
  width: number;
  height: number;
  compact?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const aspect = width / Math.max(height, 1);

  return (
    <div
      className={cn(
        "relative mx-auto overflow-hidden rounded-[12px] border border-white/[0.09] bg-black",
        "shadow-[0_8px_40px_rgb(0_0_0/0.4)] transition-all duration-500",
        compact
          ? "[--frame-max-h:min(28vh,260px)] sm:[--frame-max-h:min(34vh,330px)]"
          : "[--frame-max-h:min(36vh,300px)] sm:[--frame-max-h:min(52vh,530px)]",
        className,
      )}
      style={{
        aspectRatio: String(aspect),
        maxHeight: "var(--frame-max-h)",
        width: `min(100%, 48rem, calc(var(--frame-max-h) * ${aspect}))`,
      }}
    >
      {children}
    </div>
  );
}

export function ChallengeBoard({
  challenge,
  level,
  movie,
}: ChallengeBoardProps) {
  const {
    session,
    potentialScore,
    scoreBreakdown,
    visibleRegionCount,
    isFinished,
    canSurrender,
    openNextReveal,
    submitGuess,
    surrender,
    startChallenge,
  } = useChallenge({ challenge, level, movie });

  const [guess, setGuess] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const [isWrongGuess, setIsWrongGuess] = useState(false);
  const [imageExpanded, setImageExpanded] = useState(false);
  /** Win beat: полное изображение → название → экран результата */
  const [winBeat, setWinBeat] = useState<"image" | "title" | "result">(
    "image",
  );
  const wrongGuessTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (wrongGuessTimeoutRef.current !== null) {
        window.clearTimeout(wrongGuessTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (session.state !== "COMPLETED") {
      setWinBeat("image");
      return;
    }

    setWinBeat("image");
    const titleTimer = window.setTimeout(() => setWinBeat("title"), 320);
    const resultTimer = window.setTimeout(() => setWinBeat("result"), 700);
    return () => {
      window.clearTimeout(titleTimer);
      window.clearTimeout(resultTimer);
    };
  }, [session.state]);

  const areaRegions = [...level.revealRegions]
    .filter((region) => region.kind !== "full_image")
    .sort((a, b) => a.displayOrder - b.displayOrder);

  const viewerRegions: ViewerRegion[] = areaRegions.map((region) => ({
    id: region.id,
    label: region.name,
    points: region.polygon,
  }));

  const revealLevel =
    visibleRegionCount >= REVEAL_REGION_COUNT || isFinished
      ? viewerRegions.length
      : visibleRegionCount - 1;

  const canOpenMore =
    !isFinished && session.openedRegionCount < REVEAL_REGION_COUNT;

  const imageCompact = isFinished && !imageExpanded;

  function showTemporaryFeedback(message: string) {
    setFeedback(message);
    window.setTimeout(() => setFeedback(null), FEEDBACK_MESSAGE_MS);
  }

  function playWrongGuessFeedback(
    submittedValue: string,
    followUpMessage: string | null,
  ) {
    setIsWrongGuess(true);
    setGuess(submittedValue);
    triggerWrongGuessVibration();

    if (wrongGuessTimeoutRef.current !== null) {
      window.clearTimeout(wrongGuessTimeoutRef.current);
    }

    wrongGuessTimeoutRef.current = window.setTimeout(() => {
      setIsWrongGuess(false);
      setGuess("");
      if (followUpMessage) {
        showTemporaryFeedback(followUpMessage);
      }
    }, WRONG_GUESS_FEEDBACK_MS);
  }

  function handleGuessSubmit(value: string) {
    const openedBefore = session.openedRegionCount;
    const submitted = value.trim();
    const result = submitGuess(value);

    if (!submitted) {
      setGuess("");
      showTemporaryFeedback(
        openedBefore + 1 >= REVEAL_REGION_COUNT
          ? "Открыто полное изображение — последняя попытка"
          : "Открыта следующая область",
      );
      return;
    }

    if (result.isCorrect || result.isLost) {
      setGuess("");
      setFeedback(null);
      return;
    }

    const followUp =
      openedBefore + 1 >= REVEAL_REGION_COUNT
        ? "Открыто полное изображение — последняя попытка"
        : "Неверно — открыта следующая область";

    playWrongGuessFeedback(submitted, followUp);
  }

  async function handleShare() {
    if (!scoreBreakdown) return;
    const result = await shareChallengeResult({
      movieTitle: movie.title,
      movieScore: scoreBreakdown.total,
      openedRegionCount: session.openedRegionCount,
      won: true,
    });
    setShareFeedback(
      result === "copied"
        ? "Скопировано"
        : result === "shared"
          ? "Отправлено"
          : "Не удалось",
    );
    window.setTimeout(() => setShareFeedback(null), 2000);
  }

  const image = (
    <ChallengeImageFrame
      width={level.width}
      height={level.height}
      compact={imageCompact}
      className={cn(
        isWrongGuess && "wrong-guess-flash",
        session.state === "COMPLETED" && "result-win-frame",
        session.state === "LOST" && "result-lose-frame",
      )}
    >
      <ProgressiveRevealImage
        imageSrc={level.image}
        revealLevel={session.state === "NOT_STARTED" ? -1 : revealLevel}
        regions={viewerRegions}
        width={level.width}
        height={level.height}
        className="h-full max-h-full w-full"
      />
    </ChallengeImageFrame>
  );

  const progressSegments = (
    <div className="flex gap-1.5">
      {Array.from({ length: REVEAL_REGION_COUNT }, (_, index) => (
        <span
          key={index}
          className={cn(
            "h-1.5 w-9 rounded-full transition-colors duration-500",
            index < session.openedRegionCount
              ? isWrongGuess
                ? "bg-rose-300/70"
                : session.state === "COMPLETED"
                  ? "bg-[var(--accent)]"
                  : session.state === "LOST"
                    ? "bg-rose-300/50"
                    : "bg-[var(--accent)]"
              : "bg-white/[0.12]",
          )}
        />
      ))}
    </div>
  );

  if (session.state === "NOT_STARTED") {
    return (
      <div className="fade-up mx-auto flex w-full max-w-3xl flex-col items-center">
        <div className="mb-3 w-full sm:mb-5">{image}</div>
        <p className="mb-4 max-w-md text-center text-sm leading-relaxed text-white/50 sm:mb-6">
          Угадайте фильм по визуальной ДНК. Каждая открытая область снижает
          количество очков.
        </p>
        <Button size="lg" onClick={startChallenge}>
          Начать
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      <div className="mb-2 flex w-full items-center justify-between text-[10px] font-medium uppercase tracking-widest text-white/40 sm:mb-3 sm:text-[11px]">
        <span>
          Подсказка {Math.min(session.openedRegionCount, REVEAL_REGION_COUNT)}/
          {REVEAL_REGION_COUNT}
        </span>
        <span
          className={cn(
            session.state !== "LOST" &&
              session.state !== "COMPLETED" &&
              "text-[var(--accent)]/80",
          )}
        >
          {session.state === "COMPLETED"
            ? `Очки ${session.movieScore}`
            : session.state === "LOST"
              ? "Очки —"
              : `Очки ${potentialScore}`}
        </span>
      </div>

      <div className="mb-3 w-full sm:mb-4">{image}</div>

      <div className="mb-4 sm:mb-5">{progressSegments}</div>

      {session.state === "COMPLETED" && (winBeat === "title" || winBeat === "result") && (
        <div
          className={cn(
            "win-title-reveal mb-4 w-full max-w-md text-center",
            winBeat === "result" && "opacity-90",
          )}
        >
          <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-[var(--accent)]">
            Это
          </p>
          <h2 className="mt-1.5 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            {movie.title}
          </h2>
          <p className="mt-1 text-sm text-white/45">
            {movie.titleOriginal ? `${movie.titleOriginal} · ` : ""}
            {movie.year}
          </p>
        </div>
      )}

      {session.state === "COMPLETED" &&
      winBeat === "result" &&
      scoreBreakdown ? (
        <div className="result-win relative w-full max-w-md text-center">
          <ConfettiOverlay />

          <TrophyIcon />

          <p className="mt-4 text-sm font-semibold uppercase tracking-[0.25em] text-[var(--accent)]">
            Отлично!
          </p>

          <p className="mt-6 text-5xl font-bold tabular-nums text-white">
            {scoreBreakdown.total}
          </p>
          <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.3em] text-white/40">
            Movie Score
          </p>

          <p className="mt-4 text-xs text-white/40">
            Подсказки {scoreBreakdown.openedRegionCount}/{REVEAL_REGION_COUNT}
            {" · "}
            {formatElapsed(scoreBreakdown.elapsedSeconds)}
            {" · "}бонусы +
            {scoreBreakdown.timeBonus +
              scoreBreakdown.guessBonus +
              scoreBreakdown.firstPlayBonus}
          </p>

          <div className="mt-6 flex w-full flex-col gap-2.5">
            <Link
              href={GAME_ROUTES.archive}
              className="inline-flex h-12 w-full items-center justify-center rounded-[10px] bg-[var(--accent)] text-sm font-medium text-black transition-all duration-200 hover:brightness-105 active:scale-[0.98]"
            >
              Перейти в архив
            </Link>
            <Button
              variant="secondary"
              size="lg"
              className="w-full"
              onClick={() => void handleShare()}
            >
              Поделиться результатом
            </Button>
            {shareFeedback && (
              <p className="text-xs text-white/40">{shareFeedback}</p>
            )}
          </div>
        </div>
      ) : session.state === "LOST" ? (
        <div className="result-lose w-full max-w-md text-center">
          <LoseIcon />

          <p className="mt-4 text-sm font-semibold uppercase tracking-[0.25em] text-rose-300/90">
            Не получилось
          </p>
          <p className="mt-3 text-[11px] uppercase tracking-[0.25em] text-white/35">
            Правильный ответ
          </p>
          <h2 className="mt-1 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            {movie.title}
          </h2>
          {movie.titleOriginal && (
            <p className="mt-1.5 text-sm text-white/50">
              {movie.titleOriginal}
            </p>
          )}
          <p className="mt-0.5 text-xs text-white/35">{movie.year}</p>

          <div className="mt-6 flex w-full flex-col gap-2.5">
            {!imageExpanded && (
              <Button
                variant="secondary"
                size="lg"
                className="w-full"
                onClick={() => setImageExpanded(true)}
              >
                Посмотреть изображение полностью
              </Button>
            )}
            <Link
              href={GAME_ROUTES.archive}
              className="inline-flex h-12 w-full items-center justify-center rounded-[10px] bg-white text-sm font-medium text-black transition-all duration-200 hover:bg-white/90 active:scale-[0.98]"
            >
              Перейти в архив
            </Link>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-md">
          <div className={cn(isWrongGuess && "wrong-guess-shake")}>
            <MovieSearchInput
              value={guess}
              onChange={setGuess}
              disabled={isWrongGuess}
              isError={isWrongGuess}
              hideSubmitButton
              onSubmit={handleGuessSubmit}
            />
          </div>

          {isWrongGuess && (
            <p className="wrong-guess-message mt-2 text-center text-sm text-rose-300/80">
              Неверно
            </p>
          )}

          <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <Button
              size="lg"
              className="w-full"
              disabled={isWrongGuess || guess.trim().length === 0}
              onClick={() => handleGuessSubmit(guess)}
            >
              Проверить ответ
            </Button>

            {canSurrender ? (
              <Button
                variant="secondary"
                size="lg"
                className="w-full border-rose-300/25 text-rose-100/85 hover:border-rose-300/40 hover:bg-rose-400/[0.08]"
                disabled={isWrongGuess}
                onClick={surrender}
              >
                Сдаться
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="lg"
                className="w-full"
                disabled={!canOpenMore || isWrongGuess}
                onClick={() => {
                  const nextCount = session.openedRegionCount + 1;
                  openNextReveal();
                  showTemporaryFeedback(
                    nextCount >= REVEAL_REGION_COUNT
                      ? "Открыто полное изображение — последняя попытка"
                      : "Открыта следующая область",
                  );
                }}
              >
                {session.openedRegionCount === REVEAL_REGION_COUNT - 1
                  ? "Открыть всё изображение"
                  : "Открыть следующую подсказку"}
              </Button>
            )}
          </div>

          <div className="mt-3 flex flex-col items-center gap-1.5">
            {feedback && !isWrongGuess && (
              <p className="text-center text-sm text-white/45">{feedback}</p>
            )}
            <p className="text-center text-[11px] text-white/25">
              {canSurrender
                ? "Все подсказки открыты. Можно угадать или сдаться."
                : "Сначала проверь ответ — подсказка открывается только если нужно"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
