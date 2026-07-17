import type {
  AnalyticsEventName,
  TrackArgs,
} from "./events";
import { toProperties, type AnalyticsProvider } from "./providers/types";

/**
 * Единая точка входа аналитики MovieDNA.
 *
 * UI / hooks вызывают только `analytics.track(...)`.
 * Провайдеры (GA4, Clarity, Supabase) регистрируются отдельно
 * и не протекают в presentation layer.
 */
class Analytics {
  private providers: AnalyticsProvider[] = [];
  private registeredNames = new Set<string>();

  /** Подключить провайдер. Повторная регистрация с тем же name игнорируется. */
  register(provider: AnalyticsProvider): void {
    if (this.registeredNames.has(provider.name)) return;
    this.registeredNames.add(provider.name);
    this.providers.push(provider);
  }

  /** Снять все провайдеры (тесты / hot-reload). */
  reset(): void {
    this.providers = [];
    this.registeredNames.clear();
  }

  /** Список имён активных провайдеров — для отладки. */
  listProviders(): string[] {
    return this.providers.map((provider) => provider.name);
  }

  /**
   * Отправить типизированное событие во все зарегистрированные провайдеры.
   *
   * @example
   * analytics.track("guess_wrong", { challengeId: "challenge-joker" });
   * analytics.track("challenge_completed", { challengeId, movieScore: 920 });
   * analytics.track("archive_opened");
   */
  track<E extends AnalyticsEventName>(
    event: E,
    ...args: TrackArgs<E>
  ): void {
    const payload = args[0];
    const properties = toProperties(payload);

    for (const provider of this.providers) {
      try {
        provider.track(event, properties);
      } catch {
        // A broken provider must not affect the game or other providers.
      }
    }
  }
}

/** Singleton — единственный публичный API аналитики. */
export const analytics = new Analytics();

export type { AnalyticsProvider };
