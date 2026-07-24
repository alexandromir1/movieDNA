import type { LevelSequence, V2PlayerProgress } from "@/types/v2-content";

import { deferredIds } from "./progress";

/**
 * Presentation-проекция Progress → разделы архива.
 */

export type ArchiveSectionKind = "closed" | "deferred" | "classified";

export interface ArchiveIndexEntry {
  caseNumber: number;
  levelId: string;
  sequenceIndex: number;
  section: ArchiveSectionKind;
}

export function buildArchiveIndex(
  progress: V2PlayerProgress,
  sequence: LevelSequence,
): ArchiveIndexEntry[] {
  const deferred = new Set(deferredIds(progress));
  const current = progress.currentSequenceIndex;

  return sequence.levelIds.map((levelId, sequenceIndex) => {
    const caseNumber = sequenceIndex + 1;
    if (deferred.has(levelId)) {
      return {
        caseNumber,
        levelId,
        sequenceIndex,
        section: "deferred" as const,
      };
    }
    if (sequenceIndex < current) {
      return {
        caseNumber,
        levelId,
        sequenceIndex,
        section: "closed" as const,
      };
    }
    return {
      caseNumber,
      levelId,
      sequenceIndex,
      section: "classified" as const,
    };
  });
}

export function partitionArchiveIndex(entries: ArchiveIndexEntry[]): {
  closed: ArchiveIndexEntry[];
  deferred: ArchiveIndexEntry[];
  classified: ArchiveIndexEntry[];
} {
  return {
    closed: entries.filter((e) => e.section === "closed"),
    deferred: entries.filter((e) => e.section === "deferred"),
    classified: entries.filter((e) => e.section === "classified"),
  };
}

/** Упорядочить deferred по progress.deferredLevelIds. */
export function orderDeferredEntries(
  deferred: ArchiveIndexEntry[],
  progress: V2PlayerProgress,
): ArchiveIndexEntry[] {
  const byId = new Map(deferred.map((e) => [e.levelId, e]));
  const ordered: ArchiveIndexEntry[] = [];
  for (const id of deferredIds(progress)) {
    const entry = byId.get(id);
    if (entry) ordered.push(entry);
  }
  return ordered;
}
