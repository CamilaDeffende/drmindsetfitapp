import { ValidationResult, TrainingPlan } from "../core/types";

export function validateTrainingPlan(plan: TrainingPlan): ValidationResult {
  const messages: string[] = [];

  if (!plan.sessions.length) messages.push("Plano sem sessões.");
  if (plan.profile.weeklyDays !== plan.sessions.length) {
    messages.push("Número de sessões não corresponde à frequência semanal.");
  }

  for (const session of plan.sessions) {
    if (!session.exercises.length) {
      messages.push(`Sessão ${session.dayIndex} sem exercícios.`);
    }
    if (session.estimatedDurationMin > plan.profile.sessionDurationMin + 15) {
      messages.push(`Sessão ${session.dayIndex} excede duração esperada.`);
    }
  }

  return {
    valid: messages.length === 0,
    messages: messages.length ? messages : ["Plano validado com sucesso."],
  };
}
