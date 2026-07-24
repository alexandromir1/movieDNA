"use server";

import {
  getBundledLevelById,
  getBundledMovieById,
} from "@/lib/content/bundled-catalog";
import { getDefaultCampaign, getCampaignSequence } from "@/lib/v2/campaigns";
import {
  buildArchiveIndex,
  orderDeferredEntries,
  partitionArchiveIndex,
} from "@/lib/v2/archive-view";
import { closedCaseCount, isSequenceComplete } from "@/lib/v2/progress";
import type { V2PlayerProgress } from "@/types/v2-content";

export interface V2ArchiveClosedCase {
  caseNumber: number;
  levelId: string;
  image: string;
  title: { ru: string; en: string };
  movieId: string;
  hasRelated: boolean;
}

/** Отложенное: обложка есть (уже видели), название скрыто — без спойлера. */
export interface V2ArchiveDeferredCase {
  caseNumber: number;
  levelId: string;
  image: string;
}

export interface V2ArchiveClassifiedCase {
  caseNumber: number;
}

export interface V2ArchiveSnapshot {
  closed: V2ArchiveClosedCase[];
  deferred: V2ArchiveDeferredCase[];
  classified: V2ArchiveClassifiedCase[];
  completedCount: number;
  totalCount: number;
  sequenceComplete: boolean;
  hasDeferred: boolean;
}

/**
 * Снимок архива для UI. Progress передаётся с клиента (localStorage).
 * Для classified не отдаём image/title — только номер дела.
 * Для deferred — image без title.
 */
export async function fetchV2ArchiveSnapshot(
  progress: V2PlayerProgress,
): Promise<V2ArchiveSnapshot> {
  const sequence = getCampaignSequence(getDefaultCampaign());
  const parts = partitionArchiveIndex(buildArchiveIndex(progress, sequence));
  const deferredEntries = orderDeferredEntries(parts.deferred, progress);

  const closed: V2ArchiveClosedCase[] = [];
  for (const entry of parts.closed) {
    const level = getBundledLevelById(entry.levelId);
    if (!level) continue;
    const movie = getBundledMovieById(level.movieId);
    if (!movie) continue;
    closed.push({
      caseNumber: entry.caseNumber,
      levelId: entry.levelId,
      image: level.image,
      title: movie.title,
      movieId: movie.id,
      hasRelated: Boolean(movie.recommendations?.length),
    });
  }

  const deferred: V2ArchiveDeferredCase[] = [];
  for (const entry of deferredEntries) {
    const level = getBundledLevelById(entry.levelId);
    if (!level) continue;
    deferred.push({
      caseNumber: entry.caseNumber,
      levelId: entry.levelId,
      image: level.image,
    });
  }

  const classified: V2ArchiveClassifiedCase[] = parts.classified.map(
    (entry) => ({ caseNumber: entry.caseNumber }),
  );

  return {
    closed,
    deferred,
    classified,
    completedCount: closedCaseCount(progress),
    totalCount: sequence.levelIds.length,
    sequenceComplete: isSequenceComplete(progress, sequence),
    hasDeferred: deferred.length > 0,
  };
}
