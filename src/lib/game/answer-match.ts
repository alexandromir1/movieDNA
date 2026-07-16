/**
 * @deprecated Проверка ответа перенесена в Engine (src/engine/guess).
 * Временный shim обратной совместимости; будет удалён на этапе очистки.
 * Новый код должен использовать ChallengeSession.submitGuess() или GuessValidator.
 */

import { GuessValidator } from "@/engine/guess";

export function isAcceptedAnswer(
  guess: string,
  acceptedAnswers: string[],
): boolean {
  return new GuessValidator(acceptedAnswers).validate(guess).success;
}
