import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AnalyticsDevDashboard } from "@/components/analytics/AnalyticsDevDashboard";

export const metadata: Metadata = {
  title: "Analytics · MovieDNA",
};

/**
 * Внутренний product dashboard — не Content Studio / не админка.
 * Только local development (как /dev).
 */
export default function AnalyticsDevPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return <AnalyticsDevDashboard />;
}
