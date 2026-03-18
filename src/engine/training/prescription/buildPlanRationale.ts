import { TrainingProfile, TrainingSession } from "../core/types";

export function buildPlanRationale(profile: TrainingProfile, sessions: TrainingSession[]): string[] {
  return [
    `split escolhido respeitando ${profile.availableDays} dias disponíveis`,
    `janela média por sessão: ${profile.sessionDurationMin} min`,
    `recuperação classificada como ${profile.recoveryLevel}`,
    `nível classificado como ${profile.level}`,
    `sessões montadas: ${sessions.length}`,
  ];
}
