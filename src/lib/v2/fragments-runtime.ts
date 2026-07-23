import type {
  FragmentPiece,
  FragmentsDefinition,
  RevealDefinitionFragments,
} from "@/types/v2-content";

/**
 * Runtime-контракт Reveal Strategy (docs/v2-domain-model.md §6.4).
 * Session владеет openedSteps; геометрия остаётся в FragmentsDefinition.
 */
export interface FragmentsRevealRuntime {
  kind: "fragments";
  openedSteps: number;
  totalSteps: number;
}

export function createFragmentsRuntime(
  definition: RevealDefinitionFragments,
): FragmentsRevealRuntime {
  const totalSteps = definition.stepCount;
  return {
    kind: "fragments",
    /** Первый фрагмент уже виден при старте Session (first-run). */
    openedSteps: totalSteps > 0 ? 1 : 0,
    totalSteps,
  };
}

export function canRevealNext(runtime: FragmentsRevealRuntime): boolean {
  return runtime.openedSteps < runtime.totalSteps;
}

export function revealNext(
  runtime: FragmentsRevealRuntime,
): FragmentsRevealRuntime {
  if (!canRevealNext(runtime)) return runtime;
  return {
    ...runtime,
    openedSteps: runtime.openedSteps + 1,
  };
}

/** Куски, видимые при текущем openedSteps (1-based count). */
export function getVisiblePieces(
  data: FragmentsDefinition,
  openedSteps: number,
): FragmentPiece[] {
  if (openedSteps <= 0) return [];
  return data.pieces.slice(0, openedSteps);
}
