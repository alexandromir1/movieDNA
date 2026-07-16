import { normalizeTitle } from "@/lib/game/title-match";

/** Небольшое расстояние Левенштейна для опечаток */
function levenshtein(a: string, b: string): number {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const matrix: number[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => 0),
  );

  for (let i = 0; i < rows; i++) matrix[i][0] = i;
  for (let j = 0; j < cols; j++) matrix[0][j] = j;

  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      );
    }
  }

  return matrix[a.length][b.length];
}

function maxAllowedDistance(length: number): number {
  if (length <= 4) return 1;
  if (length <= 8) return 2;
  return 3;
}

export function isAcceptedAnswer(
  guess: string,
  acceptedAnswers: string[],
): boolean {
  const normalizedGuess = normalizeTitle(guess);
  if (!normalizedGuess) return false;

  return acceptedAnswers.some((answer) => {
    const normalizedAnswer = normalizeTitle(answer);
    if (!normalizedAnswer) return false;
    if (normalizedGuess === normalizedAnswer) return true;

    const distance = levenshtein(normalizedGuess, normalizedAnswer);
    return distance <= maxAllowedDistance(normalizedAnswer.length);
  });
}
