"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import {
  analytics,
  consumeRecommendationAttribution,
  GAProvider,
  getGaMeasurementId,
  getPostHogApiKey,
  getPostHogHost,
  PostHogProvider,
  setAnalyticsLocale,
} from "@/analytics";
import {
  clearChallengeTiming,
  getSecondsPlayed,
  markFirstGuessIfNeeded,
  markRegionOpened,
  resetChallengeTiming,
} from "@/analytics/timing";
import { engineEvents } from "@/engine/events";
import { useLocale } from "@/lib/i18n/LocaleProvider";

const SESSION_FLAG = "moviedna-analytics-session";
const SESSION_START_MS = "moviedna-analytics-session-start";

/**
 * Bootstrap аналитики на клиенте.
 * Без ключей компонент ничего не ломает.
 */
export function AnalyticsBootstrap() {
  const measurementId = getGaMeasurementId();
  const posthogKey = getPostHogApiKey();
  const posthogHost = getPostHogHost();
  const pathname = usePathname();
  const { locale } = useLocale();
  const registeredRef = useRef(false);
  const sessionEndedRef = useRef(false);

  useEffect(() => {
    if (registeredRef.current) return;

    if (measurementId) {
      analytics.register(new GAProvider(measurementId));
    }
    if (posthogKey) {
      const posthog = new PostHogProvider(posthogKey, posthogHost);
      analytics.register(posthog);
      posthog.warm();
    }
    registeredRef.current = true;
  }, [measurementId, posthogKey, posthogHost]);

  useEffect(() => {
    setAnalyticsLocale(locale);
  }, [locale]);

  /** Session Started — один раз на вкладку. */
  useEffect(() => {
    try {
      if (sessionStorage.getItem(SESSION_FLAG)) return;
      sessionStorage.setItem(SESSION_FLAG, "1");
      sessionStorage.setItem(SESSION_START_MS, String(Date.now()));
    } catch {
      // private mode — всё равно шлём started
    }
    analytics.track("session_started");
  }, []);

  /** Session Ended — visibility / pagehide. */
  useEffect(() => {
    function endSession() {
      if (sessionEndedRef.current) return;
      sessionEndedRef.current = true;
      let durationSeconds = 0;
      try {
        const start = Number(sessionStorage.getItem(SESSION_START_MS) ?? 0);
        if (start > 0) {
          durationSeconds = Math.max(
            0,
            Math.round((Date.now() - start) / 1000),
          );
        }
      } catch {
        // ignore
      }
      analytics.track("session_ended", { durationSeconds });
    }

    function onVisibility() {
      if (document.visibilityState === "hidden") endSession();
      if (document.visibilityState === "visible") {
        sessionEndedRef.current = false;
      }
    }

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", endSession);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", endSession);
    };
  }, []);

  useEffect(() => {
    if (!pathname) return;
    analytics.track("page_view", {
      path: pathname,
      title: typeof document !== "undefined" ? document.title : undefined,
    });

    if (pathname === "/") {
      analytics.track("home_open");
    }
    if (pathname === "/v2" || pathname === "/v2/") {
      analytics.track("home_open");
    }
    if (pathname === "/archive" || pathname.startsWith("/archive/")) {
      analytics.track("archive_opened");
    }
    if (pathname === "/v2/archive" || pathname.startsWith("/v2/archive/")) {
      analytics.track("archive_opened");
    }
  }, [pathname]);

  useEffect(() => {
    return engineEvents.subscribe((event) => {
      switch (event.name) {
        case "challenge_started":
          resetChallengeTiming();
          {
            const attribution = consumeRecommendationAttribution();
            analytics.track("challenge_started", {
              ...event.payload,
              ...(attribution
                ? {
                    startedFromRecommendation: true,
                    recommendedMovieId: attribution.recommendedMovieId,
                    recommendedMovieTitle: attribution.recommendedMovieTitle,
                  }
                : {}),
            });
          }
          break;
        case "challenge_completed":
          analytics.track("challenge_completed", {
            ...event.payload,
            secondsPlayed: getSecondsPlayed(),
          });
          clearChallengeTiming();
          break;
        case "challenge_failed":
          analytics.track("challenge_failed", {
            ...event.payload,
            secondsPlayed: getSecondsPlayed(),
          });
          clearChallengeTiming();
          break;
        case "challenge_give_up":
          analytics.track("challenge_give_up", event.payload);
          analytics.track("challenge_failed", {
            ...event.payload,
            secondsPlayed: getSecondsPlayed(),
          });
          clearChallengeTiming();
          break;
        case "reveal_opened": {
          const timeBetweenRegions = markRegionOpened() ?? undefined;
          const payload = { ...event.payload, timeBetweenRegions };
          analytics.track("region_opened", payload);
          analytics.track("hint_used", payload);
          break;
        }
        case "guess_submitted":
          if ((event.payload.guessLength ?? 0) > 0) {
            markFirstGuessIfNeeded();
          }
          analytics.track("guess_submitted", event.payload);
          break;
        case "guess_correct":
          analytics.track("correct_guess", event.payload);
          break;
        case "guess_wrong":
          analytics.track("wrong_guess", event.payload);
          break;
      }
    });
  }, []);

  if (!measurementId) {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${measurementId}', { send_page_view: false });
        `}
      </Script>
    </>
  );
}
