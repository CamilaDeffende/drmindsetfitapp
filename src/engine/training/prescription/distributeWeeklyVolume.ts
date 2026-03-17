import { GOAL_VOLUME_BASE } from "../core/constants";
import { TrainingProfile, VolumeDistributionResult } from "../core/types";

export function distributeWeeklyVolume(profile: TrainingProfile): VolumeDistributionResult {
  const base = GOAL_VOLUME_BASE[profile.primaryGoal] ?? 10;
  const modifier =
    profile.recoveryScore < 45 ? -2 :
    profile.recoveryScore > 75 ? 2 :
    0;

  const weeklyVolumeByMuscle: Record<string, number> = {
    chest: Math.max(4, base + modifier),
    back: Math.max(4, base + modifier),
    quadriceps: Math.max(4, base + modifier),
    hamstrings: Math.max(3, base - 1 + modifier),
    shoulders: Math.max(3, Math.round(base * 0.6) + modifier),
    glutes: Math.max(3, Math.round(base * 0.6) + modifier),
    arms: Math.max(2, Math.round(base * 0.4)),
    core: 4,
  };

  return { weeklyVolumeByMuscle };
}
