"use client";

import posthog from "posthog-js";
import Link from "next/link";
import { useEffect } from "react";

import { Button } from "@/components/ui/Button";
import { GAME_ROUTES } from "@/lib/game/constants";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
    posthog.captureException(error);
  }, [error]);

  return (
    <html lang="ru">
      <body className="flex min-h-dvh flex-col items-center justify-center bg-[#0e0e10] px-4 text-center text-white">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/35">
          MovieDNA
        </p>
        <h1 className="mt-3 text-2xl font-semibold">Что-то пошло не так</h1>
        <p className="mt-3 max-w-sm text-sm text-white/45">
          Игра споткнулась. Можно попробовать ещё раз или вернуться к Daily.
        </p>
        <div className="mt-8 flex w-full max-w-xs flex-col gap-2.5">
          <Button
            size="lg"
            className="h-12 w-full font-semibold"
            onClick={reset}
          >
            Попробовать снова
          </Button>
          <Link
            href={GAME_ROUTES.today}
            className="inline-flex h-11 items-center justify-center rounded-[10px] border border-white/15 text-sm text-white/70"
          >
            К сегодняшнему Challenge
          </Link>
        </div>
      </body>
    </html>
  );
}
