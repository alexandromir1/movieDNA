import type {
  AnalyticsEventName,
  AnalyticsPayload,
  AnalyticsProperties,
} from "../events";

/**
 * Контракт провайдера аналитики.
 * UI не знает о GA / Clarity / Supabase — только о Analytics.track().
 */
export interface AnalyticsProvider {
  readonly name: string;

  /**
   * Отправить событие во внешний сервис.
   * Провайдер сам решает, как маппить имя и payload.
   * Не должен бросать наружу — ошибки глотаются внутри.
   */
  track(
    event: AnalyticsEventName,
    properties: AnalyticsProperties,
  ): void;
}

/** Нормализует типизированный payload в плоский словарь для провайдеров. */
export function toProperties<E extends AnalyticsEventName>(
  payload: AnalyticsPayload<E> | undefined,
): AnalyticsProperties {
  if (!payload) return {};
  return { ...payload } as AnalyticsProperties;
}
