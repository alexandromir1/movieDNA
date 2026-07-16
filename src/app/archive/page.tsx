import type { Metadata } from "next";

import { getArchiveList } from "@/actions/game";
import { PlayerArchiveList } from "@/components/archive/PlayerArchiveList";
import { Container } from "@/components/layout/Container";

export const metadata: Metadata = {
  title: "Архив",
};

export default async function ArchivePage() {
  const items = await getArchiveList();

  return (
    <Container>
      <h1 className="mb-2 text-2xl font-bold">Архив</h1>
      <p className="mb-6 max-w-xl text-sm text-white/40">
        Прошедшие Daily Challenge без спойлеров. Если ты недавно в игре — можно
        наверстать старые дни. Каждую игру можно пройти один раз: после
        завершения она закрывается.
      </p>

      <PlayerArchiveList items={items} />
    </Container>
  );
}
