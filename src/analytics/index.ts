export { analytics } from "./Analytics";
export type { AnalyticsProvider } from "./Analytics";

export type {
  AnalyticsEventName,
  AnalyticsEventMap,
  AnalyticsPayload,
  AnalyticsProperties,
  AnalyticsCommonProperties,
  TrackArgs,
} from "./events";

export {
  setAnalyticsChallengeContext,
  clearAnalyticsChallengeContext,
  setAnalyticsLocale,
  buildCommonProperties,
} from "./context";
export type { AnalyticsChallengeContext } from "./context";

export {
  resetChallengeTiming,
  clearChallengeTiming,
  markFirstGuessIfNeeded,
  markRegionOpened,
  getSecondsToFirstGuess,
  getSecondsPlayed,
  hasChallengeTiming,
} from "./timing";

export {
  loadAnalyticsEventLog,
  clearAnalyticsEventLog,
  countAnalyticsEvents,
} from "./local-store";
export type { StoredAnalyticsEvent } from "./local-store";

export {
  buildAnalyticsDashboard,
  formatSeconds,
  formatPercent,
  formatRegion,
  difficultyLabel,
} from "./dashboard";
export type {
  AnalyticsDashboardSummary,
  MovieMetricRow,
  RecognitionBucket,
  RegionShare,
  DropOffStep,
  DifficultyBand,
} from "./dashboard";

export { GAProvider, getGaMeasurementId } from "./providers/ga";
export {
  PostHogProvider,
  getPostHogApiKey,
  getPostHogHost,
} from "./providers/posthog";
