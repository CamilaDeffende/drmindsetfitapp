import { DEFAULT_BLOCK_WEEKS } from "../core/constants";
import { TrainingPlan, TrainingProfile } from "../core/types";
import { WEEKLY_TEMPLATES } from "../library/weeklyTemplates";
import { buildSessionPlan } from "./buildSessionPlan";
import { assignCardioPlan } from "./assignCardioPlan";
import { distributeWeeklyVolume } from "./distributeWeeklyVolume";
import { selectTrainingSplit } from "./selectTrainingSplit";

export function generateTrainingPlan(profile: TrainingProfile): TrainingPlan {
  const split = selectTrainingSplit(profile);
  const weeklyTemplate = WEEKLY_TEMPLATES[split].slice(0, profile.weeklyDays);
  const weeklyVolumeTarget = distributeWeeklyVolume(profile);

  const sessions = weeklyTemplate.map((focus, idx) => buildSessionPlan(idx + 1, focus, profile));
  const cardioPrescription = assignCardioPlan(profile);

  return {
    profile,
    split,
    weeklyVolumeTarget,
    weeklyVolumeByMuscle: { chest: Math.round(weeklyVolumeTarget * 0.18), back: Math.round(weeklyVolumeTarget * 0.22), quadriceps: Math.round(weeklyVolumeTarget * 0.2), hamstrings: Math.round(weeklyVolumeTarget * 0.16), shoulders: Math.round(weeklyVolumeTarget * 0.12), arms: Math.round(weeklyVolumeTarget * 0.12) },
    sessions,
    cardioPrescription,
    cardioPlan:
      String(profile.goal) === "FAT_LOSS" || profile.goal === "CARDIO_CONDITIONING"
        ? ["2x/sem 20-30min Z2 ou intervalado leve-moderado"]
        : [],
    block: {
      weeks: DEFAULT_BLOCK_WEEKS,
      progressionModel: String(profile.goal) === "STRENGTH" ? "LOAD_PROGRESSION" : "DOUBLE_PROGRESSION",
      deloadWeek: 4,
    },
    rationale: [
      "Plano gerado a partir do perfil treinável.",
      "Split, volume e seleção de exercícios foram organizados por objetivo, nível, recuperação e contexto.",
    ],
    warnings: [],
    validations: [],
    createdAt: new Date().toISOString(),
    version: 1,
  };
}
