import type { Metadata } from "next";

import { V2GameView } from "@/components/v2/V2GameView";

export const metadata: Metadata = {
  title: "v2 · Game",
  robots: { index: false, follow: false },
};

/**
 * Игровой экран MovieDNA v2 — Level из Progress + LevelSequence.
 */
export default function V2GamePage() {
  return <V2GameView />;
}
