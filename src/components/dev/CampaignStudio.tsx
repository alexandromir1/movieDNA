"use client";

import type { CampaignSequenceStudioView } from "@/lib/dev/campaign-sequence-view";
import type { LevelDifficulty } from "@/types/v2-content";

/**
 * Каркас Campaign (v2) в MovieDNA Studio.
 * Sequence — read-only просмотр Main Campaign; редакторов нет.
 */

export type CampaignStudioSection =
  | "levels"
  | "movies"
  | "sequence"
  | "preview"
  | "analytics";

const CAMPAIGN_SECTIONS: Array<{
  id: CampaignStudioSection;
  label: string;
  blurb: string;
}> = [
  {
    id: "levels",
    label: "Levels",
    blurb: "Карточки уровней Campaign: image, RevealDefinition → Fragments.",
  },
  {
    id: "movies",
    label: "Movies",
    blurb: "Справочник фильмов (общий с Daily; правки контента — здесь же).",
  },
  {
    id: "sequence",
    label: "Sequence",
    blurb: "Порядок LevelSequence: Level 1 → 2 → … без календаря.",
  },
  {
    id: "preview",
    label: "Preview",
    blurb: "Просмотр фрагментов и прохождения уровня без Engine-игры.",
  },
  {
    id: "analytics",
    label: "Analytics",
    blurb: "Сводка по Campaign-контенту (не runtime Engine).",
  },
];

interface CampaignStudioProps {
  section: CampaignStudioSection;
  onSectionChange: (section: CampaignStudioSection) => void;
  sequenceView: CampaignSequenceStudioView;
}

function difficultyTone(difficulty: LevelDifficulty): string {
  if (difficulty === "easy") return "border-emerald-400/35 text-emerald-200";
  if (difficulty === "hard") return "border-rose-400/35 text-rose-200";
  return "border-amber-400/35 text-amber-200";
}

function SequencePanel({ view }: { view: CampaignSequenceStudioView }) {
  const { easy, medium, hard } = view.difficultyCounts;

  return (
    <div className="mt-8 space-y-6">
      <div className="rounded-xl border border-white/12 bg-white/[0.03] px-5 py-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">
          Campaign
        </p>
        <h2 className="mt-2 text-xl font-semibold tracking-tight text-white">
          {view.name}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/50">
          {view.description}
        </p>
        <p className="mt-4 text-xs text-white/35">id · {view.id}</p>

        <div className="mt-5 flex flex-wrap gap-3 text-sm">
          <span className="rounded-md border border-white/15 px-3 py-1.5 text-white/80">
            {view.levelCount} levels
          </span>
          <span
            className={`rounded-md border px-3 py-1.5 ${difficultyTone("easy")}`}
          >
            easy {easy}
          </span>
          <span
            className={`rounded-md border px-3 py-1.5 ${difficultyTone("medium")}`}
          >
            medium {medium}
          </span>
          <span
            className={`rounded-md border px-3 py-1.5 ${difficultyTone("hard")}`}
          >
            hard {hard}
          </span>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/10">
        <div className="border-b border-white/10 px-4 py-3 text-[10px] uppercase tracking-[0.18em] text-white/35">
          Sequence · read only
        </div>
        <ul className="divide-y divide-white/5">
          {view.levels.map((row) => (
            <li
              key={row.levelId}
              className="flex items-center gap-3 px-4 py-2.5 text-sm"
            >
              <span className="w-8 shrink-0 tabular-nums text-white/35">
                {row.index}
              </span>
              <span className="min-w-0 flex-1 truncate text-white/85">
                {row.label}
              </span>
              <span
                className={`shrink-0 rounded border px-2 py-0.5 text-[10px] uppercase tracking-wider ${difficultyTone(row.difficulty)}`}
              >
                {row.difficulty}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function CampaignStudio({
  section,
  onSectionChange,
  sequenceView,
}: CampaignStudioProps) {
  const active =
    CAMPAIGN_SECTIONS.find((item) => item.id === section) ??
    CAMPAIGN_SECTIONS[0];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <div className="mb-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/35">
          Campaign · v2
        </p>
        <p className="mt-2 max-w-2xl text-sm text-white/45">
          Линейная очередь уровней. Порядок — продуктовая кривая сложности, не
          даты публикации.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-3">
        {CAMPAIGN_SECTIONS.map((item) => {
          const isActive = item.id === section;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSectionChange(item.id)}
              className={
                isActive
                  ? "border border-white/30 bg-white/10 px-3 py-1.5 text-xs text-white"
                  : "border border-white/10 bg-transparent px-3 py-1.5 text-xs text-white/45 hover:border-white/20 hover:text-white/70"
              }
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {section === "sequence" ? (
        <SequencePanel view={sequenceView} />
      ) : (
        <div className="mt-8 rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-14 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-white/30">
            Coming soon
          </p>
          <h2 className="mt-3 text-xl font-semibold tracking-tight text-white">
            {active.label}
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/45">
            {active.blurb}
          </p>
        </div>
      )}
    </div>
  );
}

export function isCampaignStudioSection(
  value: string | undefined,
): value is CampaignStudioSection {
  return (
    value === "levels" ||
    value === "movies" ||
    value === "sequence" ||
    value === "preview" ||
    value === "analytics"
  );
}
