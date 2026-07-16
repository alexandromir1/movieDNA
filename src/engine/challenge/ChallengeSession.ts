import { GuessValidator } from "@/engine/guess";
import { RevealManager } from "@/engine/reveal";

import { assertTransition } from "./state";

import type {
  ChallengeSessionConfig,
  ChallengeSessionSnapshot,
  ChallengeState,
} from "./types";
import type { GuessResult } from "@/engine/guess";
import type { RevealRegionDefinition } from "@/engine/reveal";

/**
 * ChallengeSession — конечный автомат игровой сессии.
 *
 * Единственная сущность Engine, которая:
 * - хранит состояние Challenge;
 * - управляет Reveal через композицию RevealManager;
 * - проверяет ответы через GuessValidator;
 * - в будущем будет вызывать Storage.
 *
 * RevealManager и GuessValidator ничего не знают о ChallengeSession.
 * UI не обращается к ним напрямую.
 */
export class ChallengeSession {
  private state: ChallengeState = "NOT_STARTED";
  private attemptCount = 0;
  private startedAt: string | null = null;
  private completedAt: string | null = null;
  private movieScore: number | null = null;
  private readonly challengeId: string;
  private readonly isFirstPlay: boolean;
  private readonly reveal = new RevealManager();
  private readonly guessValidator = new GuessValidator();

  constructor(config: ChallengeSessionConfig) {
    this.challengeId = config.challengeId;
    this.isFirstPlay = config.isFirstPlay ?? true;

    if (config.regions) {
      this.reveal.load(config.regions);
    }

    if (config.acceptedAnswers) {
      this.guessValidator.load(config.acceptedAnswers);
    }

    if (config.initialState) {
      const initial = config.initialState;
      this.state = initial.state ?? this.state;
      this.attemptCount = initial.attemptCount ?? this.attemptCount;
      this.startedAt = initial.startedAt ?? this.startedAt;
      this.completedAt = initial.completedAt ?? this.completedAt;
      this.movieScore = initial.movieScore ?? this.movieScore;

      const targetOpenedCount = Math.max(0, initial.openedRegionCount ?? 0);
      while (
        this.reveal.getSnapshot().openedCount < targetOpenedCount &&
        !this.reveal.isComplete()
      ) {
        this.reveal.openNext();
      }
    }
  }

  /** Загрузить / перезагрузить регионы уровня в RevealManager. */
  loadRegions(regions: RevealRegionDefinition[]): void {
    this.reveal.load(regions);
  }

  /** Загрузить допустимые ответы в GuessValidator. */
  loadAcceptedAnswers(acceptedAnswers: string[]): void {
    this.guessValidator.load(acceptedAnswers);
  }

  /** NOT_STARTED → WAITING_FOR_GUESS */
  start(): void {
    assertTransition(this.state, "WAITING_FOR_GUESS");
    this.state = "WAITING_FOR_GUESS";
    this.startedAt = new Date().toISOString();
  }

  /**
   * Проверить ответ игрока через GuessValidator и зафиксировать попытку.
   *
   * Верный ответ:   WAITING_FOR_GUESS → COMPLETED (score ставит caller через complete()).
   * Неверный ответ: WAITING_FOR_GUESS → REVEALING (открытие региона — openNextReveal()).
   */
  submitGuess(guess: string): GuessResult {
    const result = this.guessValidator.validate(guess);

    this.attemptCount += 1;

    if (!result.success) {
      assertTransition(this.state, "REVEALING");
      this.state = "REVEALING";
    }

    return result;
  }

  /**
   * Открыть следующую Reveal Region через RevealManager.
   *
   * Допустимо из WAITING_FOR_GUESS (ручное открытие подсказки)
   * или из REVEALING (после неверного ответа).
   * После открытия возвращает сессию в WAITING_FOR_GUESS.
   *
   * @returns открытый регион или null, если открывать больше нечего.
   */
  openNextReveal(): RevealRegionDefinition | null {
    if (this.state === "WAITING_FOR_GUESS") {
      assertTransition(this.state, "REVEALING");
      this.state = "REVEALING";
    }

    if (this.state !== "REVEALING") {
      return null;
    }

    const opened = this.reveal.openNext();

    assertTransition(this.state, "WAITING_FOR_GUESS");
    this.state = "WAITING_FOR_GUESS";

    return opened;
  }

  /** Открытые регионы — только через ChallengeSession, не напрямую из UI. */
  getOpenedRegions(): RevealRegionDefinition[] {
    return this.reveal.getOpenedRegions();
  }

  /** Все регионы открыты? */
  isRevealComplete(): boolean {
    return this.reveal.isComplete();
  }

  /**
   * WAITING_FOR_GUESS | REVEALING → COMPLETED
   *
   * @param movieScore — итоговый Score (считается Score Calculator снаружи,
   * пока UI/хук ещё владеют полным игровым циклом).
   */
  complete(movieScore: number): void {
    assertTransition(this.state, "COMPLETED");
    this.state = "COMPLETED";
    this.completedAt = new Date().toISOString();
    this.movieScore = movieScore;
  }

  /** WAITING_FOR_GUESS | REVEALING → LOST */
  lose(): void {
    assertTransition(this.state, "LOST");
    this.state = "LOST";
    this.completedAt = new Date().toISOString();
    this.movieScore = 0;
  }

  /** Снимок текущего состояния (read-only для UI). */
  getState(): ChallengeSessionSnapshot {
    const reveal = this.reveal.getSnapshot();

    return {
      challengeId: this.challengeId,
      state: this.state,
      openedRegionCount: reveal.openedCount,
      openedRegions: reveal.openedRegions,
      attemptCount: this.attemptCount,
      isFinished: this.state === "COMPLETED" || this.state === "LOST",
      isRevealComplete: reveal.isComplete,
      startedAt: this.startedAt,
      completedAt: this.completedAt,
      movieScore: this.movieScore,
      isFirstPlay: this.isFirstPlay,
    };
  }
}
