import type { GuessResult } from "./types";

/**
 * GuessValidator — проверка ответа игрока.
 *
 * Правило (docs/02-gameplay.md):
 * принимается только полное официальное название (RU или EN).
 * Регистр и знаки препинания игнорируются, сокращения и опечатки — нет.
 */

/** Нормализация названия: регистр, ё→е, пунктуация, пробелы. */
export function normalizeAnswer(value: string): string {
  return value
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

export class GuessValidator {
  private normalizedAnswers: string[] = [];

  constructor(acceptedAnswers: string[] = []) {
    this.load(acceptedAnswers);
  }

  /** Загрузить список допустимых ответов (полные названия RU/EN). */
  load(acceptedAnswers: string[]): void {
    this.normalizedAnswers = acceptedAnswers
      .map(normalizeAnswer)
      .filter(Boolean);
  }

  /** Проверить ввод игрока. Точное совпадение после нормализации. */
  validate(guess: string): GuessResult {
    const normalizedAnswer = normalizeAnswer(guess);

    if (!normalizedAnswer) {
      return { success: false, normalizedAnswer };
    }

    return {
      success: this.normalizedAnswers.includes(normalizedAnswer),
      normalizedAnswer,
    };
  }
}
