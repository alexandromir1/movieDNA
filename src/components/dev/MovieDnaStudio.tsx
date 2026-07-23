"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { CampaignStudio, isCampaignStudioSection } from "@/components/dev/CampaignStudio";
import { ContentStudio } from "@/components/dev/ContentStudio";
import type { CampaignSequenceStudioView } from "@/lib/dev/campaign-sequence-view";
import type { ContentStudioData } from "@/lib/dev/content-library";

export type StudioMode = "daily" | "campaign";

type DailySection =
  | "movies"
  | "levels"
  | "challenges"
  | "queue"
  | "archive";

interface MovieDnaStudioProps {
  data: ContentStudioData;
  campaignSequenceView: CampaignSequenceStudioView;
  initialMode?: StudioMode;
  initialLevelSlug?: string;
  initialDailySection?: DailySection;
  initialCampaignSection?: "levels" | "movies" | "sequence" | "preview" | "analytics";
}

const MODES: Array<{ id: StudioMode; label: string; hint: string }> = [
  { id: "daily", label: "Daily", hint: "v1" },
  { id: "campaign", label: "Campaign", hint: "v2" },
];

function isDailySection(value: string | undefined): value is DailySection {
  return (
    value === "movies" ||
    value === "levels" ||
    value === "challenges" ||
    value === "queue" ||
    value === "archive"
  );
}

/**
 * MovieDNA Studio — эволюция /dev.
 * Один вход: Daily (v1) и Campaign (v2) рядом, без отдельной админки.
 * Не знает Engine; только каркас UI + существующий Daily-контент.
 */
export function MovieDnaStudio({
  data,
  campaignSequenceView,
  initialMode = "daily",
  initialLevelSlug,
  initialDailySection = "queue",
  initialCampaignSection = "levels",
}: MovieDnaStudioProps) {
  const router = useRouter();
  const [mode, setMode] = useState<StudioMode>(initialMode);
  const [campaignSection, setCampaignSection] = useState(
    initialCampaignSection,
  );

  const syncUrl = useCallback(
    (next: {
      mode: StudioMode;
      dailySection?: DailySection;
      campaignSection?: typeof initialCampaignSection;
      level?: string;
    }) => {
      const params = new URLSearchParams();
      params.set("mode", next.mode);
      if (next.mode === "daily") {
        params.set("section", next.dailySection ?? "queue");
        if (next.level) params.set("level", next.level);
      } else {
        params.set("section", next.campaignSection ?? "levels");
      }
      router.replace(`/dev?${params.toString()}`, { scroll: false });
    },
    [router],
  );

  function selectMode(nextMode: StudioMode) {
    setMode(nextMode);
    if (nextMode === "daily") {
      syncUrl({
        mode: "daily",
        dailySection: initialDailySection,
        level: initialLevelSlug,
      });
    } else {
      syncUrl({ mode: "campaign", campaignSection });
    }
  }

  function onCampaignSectionChange(
    section: NonNullable<MovieDnaStudioProps["initialCampaignSection"]>,
  ) {
    setCampaignSection(section);
    syncUrl({ mode: "campaign", campaignSection: section });
  }

  return (
    <div className="min-h-[calc(100vh-7rem)]">
      <header className="border-b border-white/10 px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="text-center sm:text-left">
            <p className="text-xs uppercase tracking-[0.25em] text-white/35">
              MovieDNA Studio
            </p>
            <p className="mt-2 text-sm text-white/45">
              Единое место для контента Daily (v1) и Campaign (v2)
            </p>
          </div>

          <div
            className="mx-auto flex w-full max-w-xs rounded-lg border border-white/12 bg-black/40 p-1 sm:mx-0 sm:w-auto"
            role="tablist"
            aria-label="Studio mode"
          >
            {MODES.map((item) => {
              const active = mode === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => selectMode(item.id)}
                  className={
                    active
                      ? "flex-1 rounded-md bg-white px-4 py-2 text-sm font-medium text-black sm:flex-none"
                      : "flex-1 rounded-md px-4 py-2 text-sm text-white/50 transition-colors hover:text-white/80 sm:flex-none"
                  }
                >
                  {item.label}
                  <span
                    className={
                      active ? "ml-1.5 text-black/45" : "ml-1.5 text-white/30"
                    }
                  >
                    {item.hint}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {mode === "daily" ? (
        <ContentStudio
          data={data}
          initialLevelSlug={initialLevelSlug}
          initialSection={initialDailySection}
        />
      ) : (
        <CampaignStudio
          section={campaignSection}
          onSectionChange={onCampaignSectionChange}
          sequenceView={campaignSequenceView}
        />
      )}
    </div>
  );
}

export function parseStudioMode(value: string | undefined): StudioMode {
  return value === "campaign" ? "campaign" : "daily";
}

export function parseDailySection(value: string | undefined): DailySection {
  return isDailySection(value) ? value : "queue";
}

export function parseCampaignSection(
  value: string | undefined,
): NonNullable<MovieDnaStudioProps["initialCampaignSection"]> {
  return isCampaignStudioSection(value) ? value : "levels";
}
