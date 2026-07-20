import { buildCommonProperties } from "./context";
import type {
  AnalyticsEventName,
  TrackArgs,
} from "./events";
import { appendAnalyticsEvent } from "./local-store";
import { toProperties, type AnalyticsProvider } from "./providers/types";

/**
 * Единая точка входа аналитики MovieDNA.
 *
 * UI / hooks вызывают только `analytics.track(...)`.
 * Провайдеры (GA4, PostHog, …) регистрируются отдельно
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
   * К каждому событию автоматически добавляются common properties.
   * Копия уходит в локальный лог для /analytics/dev.
   */
  track<E extends AnalyticsEventName>(
    event: E,
    ...args: TrackArgs<E>
  ): void {
    if (typeof window === "undefined") return;

    const payload = args[0];
    const properties = {
      ...buildCommonProperties(),
      ...toProperties(payload),
    };

    try {
      appendAnalyticsEvent(event, properties);
    } catch {
      // Local log must never break the game.
    }

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
