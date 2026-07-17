import type { Metadata } from "next";

import { getArchiveList } from "@/actions/game";
import { PlayerArchiveList } from "@/components/archive/PlayerArchiveList";
import { Container } from "@/components/layout/Container";

export const metadata: Metadata = {
  title: "Архив",
};

/**
 * Архив = вторая игровая сессия после Daily.
 * Один экран: главный CTA + путь игрока. Без сайдбара и лишних шагов.
 */
export default async function ArchivePage() {
  const items = await getArchiveList();

  return (
    <Container className="max-w-lg">
      <h1 className="text-2xl font-bold text-white">Архив</h1>
      <p className="mt-2 mb-7 text-sm text-white/40">
        Продолжи игру: наверстай вчера или любой пропущенный день. Один раз на
        Challenge.
      </p>

      <PlayerArchiveList items={items} />
    </Container>
  );
}
