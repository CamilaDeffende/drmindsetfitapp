import { LEVEL_VOLUME_MULTIPLIER, WEEKLY_SETS_BY_GOAL } from "../core/constants";
import { TrainingProfile } from "../core/types";

export function distributeWeeklyVolume(profile: TrainingProfile): number {
  const base = WEEKLY_SETS_BY_GOAL[profile.goal];
  const multiplier = LEVEL_VOLUME_MULTIPLIER[profile.level] ?? 1;

  let target = base.target * multiplier;

  if (profile.recoveryProfile === "LOW") target *= 0.85;
  if (profile.adherenceProfile === "LOW") target *= 0.9;
  if (profile.sessionDurationMin <= 40) target *= 0.9;

  return Math.max(base.min, Math.min(base.max, Math.round(target)));
}
