"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { shareGameResult } from "@/lib/game/share";

import type { GameAttempt } from "@/types/game";

interface ShareResultProps {
  date: string;
  attempts: GameAttempt[];
  won: boolean;
}

export function ShareResult({ date, attempts, won }: ShareResultProps) {
  const [feedback, setFeedback] = useState<string | null>(null);

  async function handleShare() {
    const result = await shareGameResult(date, attempts, won);

    if (result === "shared") {
      setFeedback("Отправлено");
    } else if (result === "copied") {
      setFeedback("Скопировано");
    } else {
      setFeedback("Не удалось");
    }

    setTimeout(() => setFeedback(null), 2000);
  }

  return (
    <div className="mt-4 flex flex-col items-center gap-2">
      <Button variant="secondary" onClick={handleShare}>
        Поделиться
      </Button>
      {feedback && <p className="text-xs text-white/40">{feedback}</p>}
    </div>
  );
}
