/**
 * Типы Guess Validator.
 *
 * Валидатор знает только про пользовательский ввод и acceptedAnswers.
 * Не знает о Reveal, Score, Storage и React.
 */

export interface GuessResult {
  /** Ответ совпал с одним из acceptedAnswers */
  success: boolean;
  /** Нормализованный ввод игрока (для логов/истории) */
  normalizedAnswer: string;
}
