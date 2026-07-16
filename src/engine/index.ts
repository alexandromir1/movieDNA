/**
 * Challenge Engine — публичный API.
 *
 * Вся игровая механика MovieDNA живёт здесь и не зависит от Next.js/React.
 * UI (React), админка (Preview) и будущие клиенты (iOS/Android) обращаются
 * только к этому API, а не к внутренним модулям Engine.
 *
 * Модули (переносятся поэтапно, по одному PR на модуль):
 *   - score/     ✅ Score Calculator
 *   - challenge/ ✅ State Machine (+ Reveal, Guess)
 *   - reveal/    ✅ Reveal Manager
 *   - guess/     ✅ Guess Validator
 *   - storage/   ⏳ Storage Adapter
 */

export * from "./score";
export * from "./challenge";
export * from "./reveal";
export * from "./guess";
