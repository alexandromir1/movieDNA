"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { addUtcDays, getUtcDateString } from "@/lib/game/daily";
import { formatSidebarDateLabel } from "@/lib/game/format-date";
import {
  loadPlayerStats,
  type CompletedChallengeRecord,
} from "@/lib/game/player-stats";
import {
  resolveChallengePlayStatus,
  type ChallengePlayStatus,
} from "@/lib/game/play-status";
import { cn } from "@/lib/utils/cn";

export interface ArchiveListItem {
  date: string;
  challengeId: string;
  title: string;
  titleOriginal: string | null;
  year: number;
  image: string;
}

interface PlayerArchiveListProps {
  items: ArchiveListItem[];
}

function isPlayable(status: ChallengePlayStatus): boolean {
  return status === "available" || status === "in_progress";
}

function isOpenable(status: ChallengePlayStatus): boolean {
  return (
    status === "available" ||
    status === "in_progress" ||
    status === "won" ||
    status === "lost"
  );
}

/**
 * Архив как вторая игровая сессия: один главный CTA + история привычки.
 * Без фильтров, поиска и спойлеров непройденных.
 */
export function PlayerArchiveList({ items }: PlayerArchiveListProps) {
  const today = getUtcDateString();
  // SSR + первый клиентский кадр без localStorage — иначе hydration mismatch.
  // Реальные статусы подтягиваем в useEffect.
  const [statuses, setStatuses] = useState<
    Record<string, ChallengePlayStatus>
  >({});
  const [records, setRecords] = useState<
    Record<string, CompletedChallengeRecord>
  >({});
  const [bestScore, setBestScore] = useState(0);

  useEffect(() => {
    const refresh = () => {
      const updated: Record<string, ChallengePlayStatus> = {};
      const nextRecords: Record<string, CompletedChallengeRecord> = {};
      const stats = loadPlayerStats();

      for (const item of items) {
        updated[item.challengeId] = resolveChallengePlayStatus(item);
      }
      for (const record of stats.completedChallenges) {
        nextRecords[record.challengeId] = record;
      }

      setStatuses(updated);
      setRecords(nextRecords);
      setBestScore(stats.bestMovieScore);
    };

    refresh();
    window.addEventListener("moviedna:stats-updated", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("moviedna:stats-updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [items]);

  const continueTarget = useMemo(() => {
    if (items.length === 0) return null;

    const yesterday = addUtcDays(today, -1);
    const byDate = new Map(items.map((item) => [item.date, item]));

    const yesterdayItem = byDate.get(yesterday);
    if (
      yesterdayItem &&
      isPlayable(statuses[yesterdayItem.challengeId] ?? "available")
    ) {
      return {
        item: yesterdayItem,
        kind: "yesterday" as const,
      };
    }

    // Newest unplayed / in-progress first (items are typically newest-first)
    for (const item of items) {
      if (isPlayable(statuses[item.challengeId] ?? "available")) {
        return {
          item,
          kind: "next" as const,
        };
      }
    }

    return null;
  }, [items, statuses, today]);

  const completedCount = items.filter((item) => {
    const status = statuses[item.challengeId];
    return status === "won" || status === "lost";
  }).length;

  if (items.length === 0) {
    return (
      <p className="text-sm text-white/35">
        Пока нет прошедших Challenge — вернись после первого Daily.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {/* Primary reason to play again */}
      {continueTarget ? (
        <Link
          href={`/game/${continueTarget.item.date}`}
          className="block rounded-[16px] border border-[var(--accent)]/45 bg-gradient-to-b from-[var(--accent)]/[0.16] to-white/[0.03] px-5 py-5 transition-all duration-200 hover:border-[var(--accent)]/70 hover:brightness-105 active:scale-[0.99]"
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">
            Сыграть ещё
          </p>
          <p className="mt-2 text-xl font-semibold text-white sm:text-2xl">
            {continueTarget.kind === "yesterday"
              ? "Вчерашний Challenge"
              : "Ещё один Challenge"}
          </p>
          <p className="mt-1 text-sm text-white/45">
            {formatSidebarDateLabel(continueTarget.item.date, today)}
            {continueTarget.kind === "yesterday"
              ? " · один клик — и ты снова в игре"
              : " · наверстай день и держи ритм"}
          </p>
          <span className="mt-4 inline-flex h-11 items-center justify-center rounded-[10px] bg-[var(--accent)] px-5 text-sm font-semibold text-black">
            {statuses[continueTarget.item.challengeId] === "in_progress"
              ? "Продолжить →"
              : "Играть →"}
          </span>
        </Link>
      ) : (
        <div className="rounded-[16px] border border-white/[0.09] bg-white/[0.03] px-5 py-5">
          <p className="text-sm font-medium text-white">
            Архив пройден
          </p>
          <p className="mt-1.5 text-sm text-white/40">
            Завтра появится новый Daily — а сюда можно вернуться за историей
            очков.
          </p>
        </div>
      )}

      {/* Habit calendar / player path */}
      <div>
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/35">
            Твой путь
          </p>
          <p className="text-xs tabular-nums text-white/35">
            {completedCount}/{items.length} сыграно
          </p>
        </div>

        <ul className="overflow-hidden rounded-[14px] border border-white/[0.09] bg-white/[0.02]">
          {items.map((item) => {
            const status = statuses[item.challengeId] ?? "available";
            const record = records[item.challengeId];
            const label = formatSidebarDateLabel(item.date, today);
            const playable = isPlayable(status);
            const openable = isOpenable(status);
            const isHighScore =
              status === "won" &&
              record &&
              bestScore > 0 &&
              record.movieScore === bestScore;

            const row = (
              <>
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <StatusMark status={status} isHighScore={Boolean(isHighScore)} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white">{label}</p>
                    {status === "won" && record ? (
                      <p className="mt-0.5 text-xs text-white/45">
                        Счёт{" "}
                        <span className="font-semibold tabular-nums text-white/80">
                          {record.movieScore}
                        </span>
                        {isHighScore ? (
                          <span className="ml-1.5 text-[var(--accent)]">
                            🏆 рекорд
                          </span>
                        ) : null}
                      </p>
                    ) : status === "lost" ? (
                      <p className="mt-0.5 text-xs text-white/40">Не угадал</p>
                    ) : status === "in_progress" ? (
                      <p className="mt-0.5 text-xs text-white/40">В процессе</p>
                    ) : (
                      <p className="mt-0.5 text-xs text-white/40">Не пройден</p>
                    )}
                  </div>
                </div>
                {playable ? (
                  <span className="shrink-0 text-xs font-medium text-[var(--accent)]">
                    {status === "in_progress" ? "Продолжить" : "Играть"} →
                  </span>
                ) : status === "won" || status === "lost" ? (
                  <span className="shrink-0 text-xs font-medium text-white/45">
                    Смотреть →
                  </span>
                ) : null}
              </>
            );

            if (openable) {
              return (
                <li key={item.challengeId} className="border-b border-white/[0.06] last:border-0">
                  <Link
                    href={`/game/${item.date}`}
                    className="flex items-center justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-white/[0.04]"
                  >
                    {row}
                  </Link>
                </li>
              );
            }

            return (
              <li
                key={item.challengeId}
                className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-3.5 last:border-0"
              >
                {row}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function StatusMark({
  status,
  isHighScore,
}: {
  status: ChallengePlayStatus;
  isHighScore: boolean;
}) {
  if (isHighScore) {
    return (
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/15 text-sm"
        aria-label="рекорд"
      >
        🏆
      </span>
    );
  }

  if (status === "won") {
    return (
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-400/15 text-sm font-semibold text-emerald-300"
        aria-label="пройден"
      >
        ✓
      </span>
    );
  }

  if (status === "lost") {
    return (
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-400/15 text-sm font-semibold text-rose-300/90"
        aria-label="не угадал"
      >
        ✕
      </span>
    );
  }

  if (status === "in_progress") {
    return (
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm text-white/60"
        aria-label="в процессе"
      >
        ◐
      </span>
    );
  }

  return (
    <span
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-sm font-semibold text-white/35",
      )}
      aria-label="не пройден"
    >
      ✕
    </span>
  );
}
