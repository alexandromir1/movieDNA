import type { Metadata } from "next";

import { getArchiveList } from "@/actions/game";
import { ArchivePageHeader } from "@/components/archive/ArchivePageHeader";
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
      <ArchivePageHeader />
      <PlayerArchiveList items={items} />
    </Container>
  );
}
