import type { Metadata } from "next";

import { V2FirstRunView } from "@/components/v2/V2FirstRunView";

export const metadata: Metadata = {
  title: "v2",
  robots: { index: false, follow: false },
};

/**
 * Первый экран MovieDNA v2 (`docs/v2-first-run.md`).
 * Без Progress / LevelSequence / игровой логики — только UI.
 */
export default function V2HomePage() {
  return <V2FirstRunView />;
}
