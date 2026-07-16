import type { Metadata } from "next";

import { Container } from "@/components/layout/Container";
import { StatsOverview } from "@/components/stats/StatsOverview";

export const metadata: Metadata = {
  title: "Статистика",
};

export default function StatsPage() {
  return (
    <Container>
      <h1 className="mb-6 text-2xl font-bold text-white">Статистика</h1>
      <StatsOverview />
    </Container>
  );
}
