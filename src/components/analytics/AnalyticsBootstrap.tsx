"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import {
  analytics,
  GAProvider,
  getGaMeasurementId,
} from "@/analytics";

/**
 * Bootstrap аналитики на клиенте.
 *
 * - регистрирует GAProvider, если есть NEXT_PUBLIC_GA_MEASUREMENT_ID;
 * - грузит официальный gtag.js;
 * - шлёт только `page_view` (остальные события — отдельные PR).
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
