import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ChallengePlayGate } from "@/components/game/ChallengePlayGate";
import { getChallengeBundleByDate } from "@/lib/content/catalog";

interface GameDatePageProps {
  params: Promise<{ date: string }>;
}

export async function generateMetadata({
  params,
}: GameDatePageProps): Promise<Metadata> {
  const { date } = await params;
  return { title: `Challenge ${date}` };
}

export default async function GameDatePage({ params }: GameDatePageProps) {
  const { date } = await params;
  const bundle = getChallengeBundleByDate(date);

  if (!bundle) {
    notFound();
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center py-10">
      <ChallengePlayGate
        challenge={bundle.challenge}
        level={bundle.level}
        movie={bundle.movie}
      />
    </div>
  );
}
