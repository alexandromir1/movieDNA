/**
 * Расписание Challenge.
 *
 * Ручные статусы: draft | ready | scheduled.
 * Дата `challenge.date` = publishAt (UTC YYYY-MM-DD).
 *
 * Вычисляемые корзины (только для scheduled):
 * - upcoming: date > today
 * - today:    date == today
 * - archive:  date < today
 */

import type { Challenge, ChallengeScheduleBucket } from "@/types/content";

import { getUtcDateString } from "@/lib/game/daily";

export function getChallengeScheduleBucket(
  challenge: Challenge,
  today: string = getUtcDateString(),
): ChallengeScheduleBucket | null {
  if (challenge.status !== "scheduled") return null;
  if (challenge.date > today) return "upcoming";
  if (challenge.date === today) return "today";
  return "archive";
}

export function isPlayableChallenge(
  challenge: Challenge,
  today: string = getUtcDateString(),
): boolean {
  const bucket = getChallengeScheduleBucket(challenge, today);
  return bucket === "today" || bucket === "archive";
}
