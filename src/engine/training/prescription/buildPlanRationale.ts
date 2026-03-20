import { TrainingProfile, TrainingSession } from "../core/types";

export function buildPlanRationale(profile: TrainingProfile, sessions: TrainingSession[]): string[] {
  return [
    `split escolhido respeitando ${profile.availableDays ?? profile.weeklyDays} dias disponíveis`,
    `recuperação classificada como ${profile.recoveryLevel ?? profile.recoveryProfile}`,
    `plano inicial com ${sessions.length} sessões`,
  ];
}
