import posthog from "posthog-js";

import type { AnalyticsEventName, AnalyticsProperties } from "../events";
import type { AnalyticsProvider } from "./types";

/**
 * PostHog через posthog-js.
 *
 * Инициализация только в браузере (SSR-safe).
 * Ключ: NEXT_PUBLIC_POSTHOG_KEY
 * Host: NEXT_PUBLIC_POSTHOG_HOST (опционально)
 */
export class PostHogProvider implements AnalyticsProvider {
  readonly name = "posthog";
  private initialized = false;

  constructor(
    private readonly apiKey: string,
    private readonly apiHost: string,
  ) {}

  /** Явная инициализация сразу после register (до первых track). */
  warm(): void {
    this.ensureInit();
  }

  private ensureInit(): boolean {
    if (typeof window === "undefined") return false;
    if (!this.apiKey) return false;
    if (this.initialized) return true;

    try {
      posthog.init(this.apiKey, {
        api_host: this.apiHost || "https://us.i.posthog.com",
        capture_pageview: false,
        capture_pageleave: true,
        persistence: "localStorage+cookie",
      });
      this.initialized = true;
      return true;
    } catch {
      return false;
    }
  }

  track(event: AnalyticsEventName, properties: AnalyticsProperties): void {
    if (typeof window === "undefined") return;
    if (!this.ensureInit()) return;

    try {
      posthog.capture(event, properties);
    } catch {
      // Analytics never breaks the product.
    }
  }
}

export function getPostHogApiKey(): string {
  return (process.env.NEXT_PUBLIC_POSTHOG_KEY ?? "").trim();
}

export function getPostHogHost(): string {
  return (
    process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com"
  ).trim();
}
