import { normalizeTitle } from "@/lib/game/title-match";

/**
 * Точное совпадение с полным официальным названием (после нормализации).
 * Сокращения и опечатки не принимаются.
 */
export function isAcceptedAnswer(
  guess: string,
  acceptedAnswers: string[],
): boolean {
  const normalizedGuess = normalizeTitle(guess);
  if (!normalizedGuess) return false;

  return acceptedAnswers.some((answer) => {
    const normalizedAnswer = normalizeTitle(answer);
    return Boolean(normalizedAnswer) && normalizedGuess === normalizedAnswer;
  });
}
