"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

import type { PuzzleStatus } from "@/types/game";

interface GameResultProps {
  status: PuzzleStatus;
  movieTitle?: string;
  attemptsUsed: number;
  onShare?: () => void;
}

export function GameResult({ status, movieTitle, attemptsUsed, onShare }: GameResultProps) {
  if (status === "pending") return null;

  const isWin = status === "won";

  return (
    <Card className="text-center">
      <Badge variant={isWin ? "success" : "warning"} className="mb-3">
        {isWin ? "Победа!" : "Игра окончена"}
      </Badge>
      <h2 className="mb-2 text-xl font-semibold">
        {isWin ? "Вы угадали фильм!" : "Фильм не угадан"}
      </h2>
      {movieTitle && (
        <p className="mb-4 text-zinc-600 dark:text-zinc-400">
          Ответ: <span className="font-medium text-zinc-900 dark:text-zinc-100">{movieTitle}</span>
        </p>
      )}
      <p className="mb-4 text-sm text-zinc-500">Попыток использовано: {attemptsUsed}</p>
      {onShare && (
        <Button variant="secondary" onClick={onShare}>
          Поделиться результатом
        </Button>
      )}
    </Card>
  );
}
