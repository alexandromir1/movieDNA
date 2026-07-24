/**
 * Presentation-only Case Analytics context for V2.
 * Не трогает Engine / Progress — только sessionStorage + helpers для track.
 */

export type V2GameMode =
  | "campaign"
  | "archive"
  | "deferred"
  | "daily"
  | "pvp";

export type V2EnteredFrom =
  | "home"
  | "archive"
  | "campaign_complete"
  | "recommendations"
  | "deeplink"
  | "continue";

export interface V2CaseAnalyticsMeta {
  caseNumber: number | null;
  gameMode: V2GameMode | null;
  enteredFrom: V2EnteredFrom | null;
}

export type V2ReturnTarget =
  | { kind: "result" }
  | { kind: "archive" };

const META_KEY = "moviedna-v2-case-analytics";
const RETURN_KEY = "moviedna-v2-return";

const EMPTY: V2CaseAnalyticsMeta = {
  caseNumber: null,
  gameMode: null,
  enteredFrom: null,
};

function readMeta(): V2CaseAnalyticsMeta {
  if (typeof window === "undefined") return { ...EMPTY };
  try {
    const raw = sessionStorage.getItem(META_KEY);
    if (!raw) return { ...EMPTY };
    return { ...EMPTY, ...(JSON.parse(raw) as Partial<V2CaseAnalyticsMeta>) };
  } catch {
    return { ...EMPTY };
  }
}

function writeMeta(next: V2CaseAnalyticsMeta): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(META_KEY, JSON.stringify(next));
  } catch {
    // private mode / quota
  }
}

/** Откуда игрок вошёл в расследование (до старта дела). */
export function setCaseEntry(input: {
  enteredFrom: V2EnteredFrom;
  gameMode?: V2GameMode;
}): void {
  const prev = readMeta();
  writeMeta({
    ...prev,
    enteredFrom: input.enteredFrom,
    gameMode: input.gameMode ?? prev.gameMode,
  });
}

/** Активное дело: номер и режим. */
export function setActiveCase(input: {
  caseNumber: number;
  gameMode: V2GameMode;
}): void {
  const prev = readMeta();
  writeMeta({
    ...prev,
    caseNumber: input.caseNumber,
    gameMode: input.gameMode,
  });
}

export function getCaseAnalyticsMeta(): V2CaseAnalyticsMeta {
  return readMeta();
}

/** Поля для всех событий Investigation / Archive / Recommendations V2. */
export function caseAnalyticsProps(): {
  caseNumber?: number;
  gameMode?: V2GameMode;
  enteredFrom?: V2EnteredFrom;
} {
  const meta = readMeta();
  return {
    ...(meta.caseNumber != null ? { caseNumber: meta.caseNumber } : {}),
    ...(meta.gameMode ? { gameMode: meta.gameMode } : {}),
    ...(meta.enteredFrom ? { enteredFrom: meta.enteredFrom } : {}),
  };
}

export function storeV2Return(target: V2ReturnTarget): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(RETURN_KEY, JSON.stringify(target));
  } catch {
    // ignore
  }
}

export function readV2Return(): V2ReturnTarget | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(RETURN_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as V2ReturnTarget;
  } catch {
    return null;
  }
}

export function clearV2Return(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(RETURN_KEY);
  } catch {
    // ignore
  }
}

export function clearV2ResultHandoff(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem("moviedna-v2-last-result");
  } catch {
    // ignore
  }
}
