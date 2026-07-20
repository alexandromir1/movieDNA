"use client";

import posthog from "posthog-js";
import Link from "next/link";
import { useEffect } from "react";

import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { GAME_ROUTES } from "@/lib/game/constants";

export default function Error({
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
    <Container className="flex flex-col items-center justify-center py-20 text-center">
      <h1 className="text-2xl font-semibold text-white">Что-то пошло не так</h1>
      <p className="mt-3 max-w-sm text-sm text-white/45">
        Страница не загрузилась. Попробуй ещё раз или открой сегодняшний
        Challenge.
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
    </Container>
  );
}
