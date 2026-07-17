import type { AnalyticsEventName, AnalyticsProperties } from "../events";
import type { AnalyticsProvider } from "./types";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Google Analytics 4 через официальный gtag.js.
 *
 * Measurement ID берётся из NEXT_PUBLIC_GA_MEASUREMENT_ID.
 * Если ID нет или gtag ещё не загружен — события тихо пропускаются.
 */
export class GAProvider implements AnalyticsProvider {
  readonly name = "ga4";

  constructor(private readonly measurementId: string) {}

  track(event: AnalyticsEventName, properties: AnalyticsProperties): void {
    if (typeof window === "undefined") return;
    if (!this.measurementId) return;
    if (typeof window.gtag !== "function") return;

    try {
      if (event === "page_view") {
        window.gtag("event", "page_view", {
          page_path: properties.path,
          page_title: properties.title,
          send_to: this.measurementId,
        });
        return;
      }

      window.gtag("event", event, {
        ...properties,
        send_to: this.measurementId,
      });
    } catch {
      // Analytics never breaks the product.
    }
  }
}

/** Читает Measurement ID из env. Пустая строка → GA отключён. */
export function getGaMeasurementId(): string {
  return (process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "").trim();
}
