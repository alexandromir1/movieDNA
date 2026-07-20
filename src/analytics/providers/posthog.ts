import posthog from "posthog-js";

import type { AnalyticsEventName, AnalyticsProperties } from "../events";
import type { AnalyticsProvider } from "./types";

/**
 * PostHog provider — forwards all analytics.track() events to PostHog.
 *
 * posthog-js is browser-only. The guard below prevents SSR errors.
 */
export class PostHogProvider implements AnalyticsProvider {
  readonly name = "posthog";

  track(event: AnalyticsEventName, properties: AnalyticsProperties): void {
    if (typeof window === "undefined") return;
    try {
      posthog.capture(event, properties);
    } catch {
      // A broken provider must not affect the game.
    }
  }
}
