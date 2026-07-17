import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { GAME_ROUTES } from "@/lib/game/constants";

export const metadata: Metadata = {
  title: "Аккаунт",
};

/**
 * Auth ещё не в релизе — честный экран вместо Not implemented.
 */
export default function LoginPage() {
  return (
    <Container className="flex justify-center py-16 sm:py-20">
      <div className="w-full max-w-sm rounded-[16px] border border-white/[0.09] bg-white/[0.03] px-5 py-8 text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/35">
          MovieDNA
        </p>
        <h1 className="mt-3 text-xl font-semibold text-white">
          Аккаунты скоро появятся
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-white/45">
          Сейчас прогресс хранится на этом устройстве. Вход не нужен, чтобы
          играть Daily и Архив.
        </p>
        <div className="mt-7 flex flex-col gap-2.5">
          <Link href={GAME_ROUTES.today}>
            <Button size="lg" className="h-12 w-full font-semibold">
              Играть сегодня
            </Button>
          </Link>
          <Link
            href={GAME_ROUTES.archive}
            className="inline-flex h-11 items-center justify-center rounded-[10px] border border-white/15 text-sm text-white/70"
          >
            Открыть Архив
          </Link>
        </div>
      </div>
    </Container>
  );
}
