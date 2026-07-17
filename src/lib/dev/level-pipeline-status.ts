import { existsSync } from "node:fs";
import path from "node:path";

import type { Challenge, Level } from "@/types/content";

/** Вычисляемый статус пайплайна Level (не хранится в JSON). */
export type LevelPipelineStatus =
  | "draft"
  | "needs_regions"
  | "needs_answers"
  | "ready"
  | "published";

export type PipelineStageId = "image" | "regions" | "answers" | "schedule";

export interface PipelineStage {
  id: PipelineStageId;
  label: string;
  done: boolean;
}

export interface LevelPipeline {
  status: LevelPipelineStatus;
  statusLabel: string;
  stages: PipelineStage[];
  imageDone: boolean;
  regionsDone: boolean;
  answersDone: boolean;
  scheduleDone: boolean;
}

const STATUS_LABELS: Record<LevelPipelineStatus, string> = {
  draft: "Draft",
  needs_regions: "Needs Regions",
  needs_answers: "Needs Answers",
  ready: "Ready",
  published: "Published",
};

export function isImageOnDisk(imagePath: string): boolean {
  if (!imagePath) return false;
  const absolute = path.join(
    process.cwd(),
    "public",
    imagePath.replace(/^\//, ""),
  );
  return existsSync(absolute);
}

export function countAreaRegions(level: Level): number {
  return (level.revealRegions ?? []).filter(
    (region) => region.kind !== "full_image",
  ).length;
}

export function hasFullReveal(level: Level): boolean {
  return (level.revealRegions ?? []).some(
    (region) => region.kind === "full_image",
  );
}

export function hasAcceptedAnswers(level: Level): boolean {
  return (level.acceptedAnswers?.length ?? 0) >= 1;
}

export function regionsComplete(level: Level): boolean {
  return countAreaRegions(level) >= 4 && hasFullReveal(level);
}

/** Image → Regions → Answers → Schedule */
export function computeLevelPipeline(
  level: Level,
  challenge: Challenge | null,
): LevelPipeline {
  const imageDone = isImageOnDisk(level.image);
  const regionsDone = regionsComplete(level);
  const answersDone = hasAcceptedAnswers(level);
  const scheduleDone = challenge?.status === "scheduled";

  const stages: PipelineStage[] = [
    { id: "image", label: "Image", done: imageDone },
    { id: "regions", label: "Regions", done: regionsDone },
    { id: "answers", label: "Answers", done: answersDone },
    { id: "schedule", label: "Schedule", done: scheduleDone },
  ];

  let status: LevelPipelineStatus;
  if (!imageDone) status = "draft";
  else if (!regionsDone) status = "needs_regions";
  else if (!answersDone) status = "needs_answers";
  else if (scheduleDone) status = "published";
  else status = "ready";

  return {
    status,
    statusLabel: STATUS_LABELS[status],
    stages,
    imageDone,
    regionsDone,
    answersDone,
    scheduleDone,
  };
}
