"use client";

import { Button } from "@/components/ui/Button";
import { REVEAL_REGION_COUNT } from "@/config/economy";

interface ChallengeStartScreenProps {
  image: React.ReactNode;
  onStart: () => void;
}

/**
 * Первый опыт до Start: показать суть за 5–10 секунд.
 * Не инструкция — желание попробовать.
 */
export function ChallengeStartScreen({
  image,
  onStart,
}: ChallengeStartScreenProps) {
  return (
    <div className="fade-up mx-auto flex w-full max-w-md flex-col items-center">
      <div className="mb-4 w-full">{image}</div>

      {/* Show: fewer reveals → higher score */}
      <div
        className="mb-4 w-full rounded-[12px] border border-white/[0.08] bg-white/[0.03] px-3 py-2.5"
        aria-hidden
      >
        <div className="flex items-center gap-2">
          <div className="flex flex-1 gap-1">
            {Array.from({ length: REVEAL_REGION_COUNT }, (_, index) => (
              <span
                key={index}
                className={
                  index === 0
                    ? "h-1.5 min-w-0 flex-1 rounded-full bg-[var(--accent)]"
                    : "h-1.5 min-w-0 flex-1 rounded-full bg-white/[0.12]"
                }
              />
            ))}
          </div>
        </div>
        <p className="mt-2 text-center text-[11px] text-white/40">
          1 подсказка · высокий Score ··· 5 · ниже
        </p>
      </div>

      <ul className="w-full space-y-2.5 text-left text-[15px] leading-snug text-white/80 sm:text-sm">
        <li className="flex gap-2.5">
          <span className="shrink-0" aria-hidden>
            🎬
          </span>
          <span>Угадай фильм по картинке</span>
        </li>
        <li className="flex gap-2.5">
          <span className="shrink-0" aria-hidden>
            🧩
          </span>
          <span>Не знаешь — открывай новые области</span>
        </li>
        <li className="flex gap-2.5">
          <span className="shrink-0" aria-hidden>
            ⭐
          </span>
          <span>Меньше подсказок — выше Movie Score</span>
        </li>
      </ul>

      <p className="mt-4 w-full text-center text-xs leading-relaxed text-white/40">
        Неверный ответ сам открывает следующую область
      </p>

      <p className="mt-3 w-full text-center text-xs font-medium text-white/55">
        📅 Каждый день — новый Challenge
      </p>

      <Button
        size="lg"
        className="mt-5 h-12 w-full text-base font-semibold sm:mt-6"
        onClick={onStart}
      >
        Попробовать
      </Button>
    </div>
  );
}
