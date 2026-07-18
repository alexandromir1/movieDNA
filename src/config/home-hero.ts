/**
 * Режим первого экрана. Меняй константу, чтобы сравнить варианты:
 * - showcase — гибрид: арт + auto-reveal без угадывания (ship)
 * - reveal_teaser — №1: то же + явный вопрос «Угадаешь раньше?»
 * - parallax — №2: blur + parallax, без reveal
 */
export type HomeHeroMode = "showcase" | "reveal_teaser" | "parallax";

export const HOME_HERO_MODE: HomeHeroMode = "showcase";

/**
 * Тайминг под типичный dwell на home/landing:
 * решение «остаться / уйти» обычно 10–15 с, ценностный скан ~5–8 с.
 * Один полный цикл до кадра целиком ≈ 10 с — механика успевает показаться
 * до ухода или тапа по CTA.
 *
 * 0.0s чёрный → 0.7s 1-я область → … → ~9.5s полный кадр → hold → цикл
 */
export const HOME_REVEAL_FIRST_DELAY_MS = 700;

/** Пауза между областями (мс). */
export const HOME_REVEAL_INTERVAL_MS = 2200;

/** Пауза на полном кадре перед новым циклом (мс). */
export const HOME_REVEAL_HOLD_MS = 2800;

/** Длительность fade области — короче интервала, чтобы кадр успел «проявиться». */
export const HOME_REVEAL_FADE_MS = 1100;
