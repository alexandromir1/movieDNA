"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import {
  analytics,
  GAProvider,
  getGaMeasurementId,
} from "@/analytics";
import { engineEvents } from "@/engine/events";

/**
 * Bootstrap аналитики на клиенте.
 *
 * - регистрирует GAProvider, если есть NEXT_PUBLIC_GA_MEASUREMENT_ID;
 * - грузит официальный gtag.js;
 * - шлёт `page_view`;
 * - подписывает Analytics на Engine Events.
 *
 * Без Measurement ID компонент ничего не ломает и не грузит скрипты.
 */
export function AnalyticsBootstrap() {
  const measurementId = getGaMeasurementId();
  const pathname = usePathname();
  const registeredRef = useRef(false);

  useEffect(() => {
    if (!measurementId || registeredRef.current) return;
    analytics.register(new GAProvider(measurementId));
    registeredRef.current = true;
  }, [measurementId]);

  useEffect(() => {
    if (!pathname) return;
    analytics.track("page_view", {
      path: pathname,
      title: typeof document !== "undefined" ? document.title : undefined,
    });
  }, [pathname]);

  useEffect(() => {
    return engineEvents.subscribe((event) => {
      switch (event.name) {
        case "challenge_started":
          analytics.track("challenge_started", event.payload);
          break;
        case "challenge_completed":
          analytics.track("challenge_completed", event.payload);
          break;
        case "challenge_failed":
          analytics.track("challenge_failed", event.payload);
          break;
        case "challenge_give_up":
          analytics.track("challenge_give_up", event.payload);
          break;
        case "reveal_opened":
          analytics.track("reveal_opened", event.payload);
          break;
        case "guess_submitted":
          analytics.track("guess_submitted", event.payload);
          break;
        case "guess_correct":
          analytics.track("guess_correct", event.payload);
          break;
        case "guess_wrong":
          analytics.track("guess_wrong", event.payload);
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
