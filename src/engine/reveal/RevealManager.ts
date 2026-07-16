import type { RevealManagerSnapshot, RevealRegionDefinition } from "./types";

/**
 * RevealManager — сервис работы с Reveal Regions.
 *
 * Ответственность:
 * - хранить список регионов;
 * - открывать следующий регион;
 * - отдавать открытые регионы;
 * - сообщать, полностью ли открыто изображение;
 * - сбрасывать прогресс открытия.
 *
 * Неуправляет ChallengeState, не считает Score, не валидирует Guess,
 * не ходит в Storage и не импортирует ChallengeSession.
 */
export class RevealManager {
  private regions: RevealRegionDefinition[] = [];
  private openedCount = 0;

  /**
   * Загрузить регионы уровня.
   * Сортирует по displayOrder и сбрасывает прогресс открытия.
   */
  load(regions: RevealRegionDefinition[]): void {
    this.regions = [...regions].sort(
      (a, b) => a.displayOrder - b.displayOrder,
    );
    this.openedCount = 0;
  }

  /**
   * Открыть следующий регион по порядку.
   * @returns открытый регион или null, если уже всё открыто / список пуст.
   */
  openNext(): RevealRegionDefinition | null {
    if (this.isComplete()) return null;

    const next = this.regions[this.openedCount] ?? null;
    if (!next) return null;

    this.openedCount += 1;
    return next;
  }

  /** Сбросить прогресс открытия (список регионов сохраняется). */
  reset(): void {
    this.openedCount = 0;
  }

  /** Список уже открытых регионов (в порядке открытия). */
  getOpenedRegions(): RevealRegionDefinition[] {
    return this.regions.slice(0, this.openedCount);
  }

  /** Все регионы загружены и открыты. */
  isComplete(): boolean {
    return this.regions.length > 0 && this.openedCount >= this.regions.length;
  }

  /** Снимок состояния Reveal (удобно для отладки / будущих клиентов). */
  getSnapshot(): RevealManagerSnapshot {
    return {
      regions: [...this.regions],
      openedCount: this.openedCount,
      openedRegions: this.getOpenedRegions(),
      isComplete: this.isComplete(),
    };
  }
}
