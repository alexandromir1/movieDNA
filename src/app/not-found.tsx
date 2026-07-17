import Link from "next/link";

import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { GAME_ROUTES } from "@/lib/game/constants";

export default function NotFound() {
  return (
    <Container className="flex flex-col items-center justify-center py-20 text-center sm:py-24">
      <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/35">
        MovieDNA
      </p>
      <h1 className="mt-3 text-2xl font-semibold text-white">
        Такой страницы нет
      </h1>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/45">
        Возможно, Challenge ещё не опубликован или ссылка устарела. Можно
        вернуться к сегодняшней игре или заглянуть в Архив.
      </p>
      <div className="mt-8 flex w-full max-w-xs flex-col gap-2.5">
        <Link href={GAME_ROUTES.today}>
          <Button size="lg" className="h-12 w-full font-semibold">
            К сегодняшнему Challenge
          </Button>
        </Link>
        <Link
          href={GAME_ROUTES.archive}
          className="inline-flex h-11 items-center justify-center rounded-[10px] border border-white/15 text-sm text-white/70 transition-colors hover:bg-white/[0.05]"
        >
          Открыть Архив
        </Link>
      </div>
    </Container>
  );
}
