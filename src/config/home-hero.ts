/**
 * Режим первого экрана. Меняй константу, чтобы сравнить варианты:
 * - showcase — гибрид: арт + auto-reveal без угадывания (ship)
 * - reveal_teaser — №1: то же + явный вопрос «Угадаешь раньше?»
 * - parallax — №2: blur + parallax, без reveal
 */
export type HomeHeroMode = "showcase" | "reveal_teaser" | "parallax";

export const HOME_HERO_MODE: HomeHeroMode = "showcase";

/**
 * Полный цикл до кадра целиком ≈ 6 с
 * (0.4 + 4 × 1.4): первая область быстро, дальше ровный ритм.
 */
export const HOME_REVEAL_FIRST_DELAY_MS = 400;

/** Пауза между областями (мс). */
export const HOME_REVEAL_INTERVAL_MS = 1400;

/** Пауза на полном кадре перед новым циклом (мс). */
export const HOME_REVEAL_HOLD_MS = 1600;

/** Fade короче интервала, чтобы область успела проявиться. */
export const HOME_REVEAL_FADE_MS = 750;
