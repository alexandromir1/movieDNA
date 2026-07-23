import type { Metadata } from "next";

import { V2ResultView } from "@/components/v2/V2ResultView";

export const metadata: Metadata = {
  title: "v2 · Result",
  robots: { index: false, follow: false },
};

/**
 * Экран результата v2 после верного ответа на тестовом Level.
 */
export default function V2ResultPage() {
  return <V2ResultView />;
}
