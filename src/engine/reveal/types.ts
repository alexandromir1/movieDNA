/**
 * Типы Reveal Manager.
 *
 * Сервис знает только о регионах изображения.
 * Не знает о Challenge, Guess, Score или Storage.
 */

/** Минимальное описание региона для Engine. */
export interface RevealRegionDefinition {
  id: string;
  /** Порядок открытия 1–N */
  displayOrder: number;
  /** Полное изображение — последняя подсказка */
  kind?: "area" | "full_image";
}

export interface RevealManagerSnapshot {
  /** Все регионы в порядке displayOrder */
  regions: RevealRegionDefinition[];
  /** Сколько регионов уже открыто */
  openedCount: number;
  /** Открытые регионы (префикс списка по displayOrder) */
  openedRegions: RevealRegionDefinition[];
  /** Все регионы открыты */
  isComplete: boolean;
}
