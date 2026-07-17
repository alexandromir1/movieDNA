import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ContentStudio } from "@/components/dev/ContentStudio";
import { loadContentStudioData } from "@/lib/dev/content-library";

export const metadata: Metadata = {
  title: "Content Studio · MovieDNA",
};

interface DevPageProps {
  searchParams: Promise<{ level?: string; section?: string }>;
}

/**
 * Content Studio только для локальной разработки.
 * API /api/dev/* уже отдают 403 в production; страница тоже скрыта (404),
 * чтобы не светить названия/расписание/checklist на публичном домене.
 */
export default async function DevPage({ searchParams }: DevPageProps) {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const params = await searchParams;
  const data = loadContentStudioData();

  const sectionParam = params.section;
  const initialSection =
    sectionParam === "movies" ||
    sectionParam === "levels" ||
    sectionParam === "challenges" ||
    sectionParam === "queue" ||
    sectionParam === "archive"
      ? sectionParam
      : "queue";

  return (
    <div className="min-h-[calc(100vh-7rem)]">
      <div className="border-b border-white/10 px-4 py-4 text-center sm:px-6">
        <p className="text-xs uppercase tracking-[0.25em] text-white/35">
          Local Content Studio
        </p>
        <p className="mt-2 text-sm text-white/45">
          Content Queue · Import Image · Levels — правки пишутся в data/*.json
        </p>
      </div>

      <ContentStudio
        data={data}
        initialLevelSlug={params.level?.toLowerCase()}
        initialSection={initialSection}
      />
    </div>
  );
}
