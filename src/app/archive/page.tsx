import type { Metadata } from "next";

import { getArchiveList } from "@/actions/game";
import { ArchiveList } from "@/components/archive/ArchiveList";
import { Container } from "@/components/layout/Container";

export const metadata: Metadata = {
  title: "Архив",
};

export default async function ArchivePage() {
  const items = await getArchiveList();

  return (
    <Container>
      <h1 className="mb-6 text-2xl font-bold">Архив игр</h1>
      <ArchiveList
        items={items.map((item) => ({
          date: item.date,
          status: item.status as "played" | "unplayed" | "won" | "lost",
        }))}
      />
    </Container>
  );
}
