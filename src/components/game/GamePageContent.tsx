"use client";

import { GameBoard } from "@/components/game/GameBoard";

import type { DailyPuzzle } from "@/types/game";

interface GamePageContentProps {
  puzzle: DailyPuzzle;
}

export function GamePageContent({ puzzle }: GamePageContentProps) {
  return <GameBoard puzzle={puzzle} />;
}
