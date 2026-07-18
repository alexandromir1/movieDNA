/**
 * Выбор следующего архивного Challenge после прохождения.
 * UI только показывает результат — не ищет «следующий» сам.
 */

export interface ArchiveChallengeLink {
  challengeId: string;
  date: string;
}

export interface GetNextArchiveChallengeOptions {
  currentChallengeId: string;
  currentDate: string;
  completedChallengeIds: ReadonlySet<string>;
}

/**
 * Следующий непройденный архивный Challenge.
 * Порядок: новее → старше (как список Архива).
 * Предпочтение — старше текущей даты (продолжить вниз);
 * иначе любой оставшийся непройденный.
 */
export function getNextArchiveChallenge(
  archiveChallenges: ArchiveChallengeLink[],
  options: GetNextArchiveChallengeOptions,
): ArchiveChallengeLink | null {
  const { currentChallengeId, currentDate, completedChallengeIds } = options;

  const sorted = [...archiveChallenges].sort((a, b) =>
    b.date.localeCompare(a.date),
  );

  const playable = sorted.filter(
    (item) =>
      item.challengeId !== currentChallengeId &&
      !completedChallengeIds.has(item.challengeId),
  );

  if (playable.length === 0) return null;

  const older = playable.find((item) => item.date < currentDate);
  if (older) return older;

  return playable[0] ?? null;
}
