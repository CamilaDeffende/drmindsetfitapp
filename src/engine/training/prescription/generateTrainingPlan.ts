import { TrainingPlan, TrainingProfile } from "../core/types";
import { safePlanId } from "../core/utils";
import { distributeWeeklyVolume } from "./distributeWeeklyVolume";
import { selectTrainingSplit } from "./selectTrainingSplit";
import { selectWeeklyTemplate } from "./selectWeeklyTemplate";
import { selectSessionTemplates } from "./selectSessionTemplates";
import { buildSessionPlan } from "./buildSessionPlan";
import { buildPlanRationale } from "./buildPlanRationale";
import { assignCardioPlan } from "./assignCardioPlan";
import { buildProgressionModel } from "../progression/buildProgressionModel";
import { validateTrainingPlan } from "../validation/validateTrainingPlan";

export function generateTrainingPlan(profile: TrainingProfile): TrainingPlan {
  const split = selectTrainingSplit(profile);
  const weeklyTemplate = selectWeeklyTemplate(split);
  const sessionTemplates = selectSessionTemplates(weeklyTemplate);
  const sessions = sessionTemplates.map((template) => buildSessionPlan(template, profile));
  const volume = distributeWeeklyVolume(profile);
  const cardioPlan = assignCardioPlan(profile);
  const progressionModel = buildProgressionModel(profile);
  const rationale = buildPlanRationale(profile, sessions);

  const draftPlan: TrainingPlan = {
    id: safePlanId(),
    profile,
    split,
    sessions,
    weeklyVolumeByMuscle: volume.weeklyVolumeByMuscle,
    cardioPlan,
    progressionModel,
    validationFlags: [],
    rationale,
    version: 1,
    createdAt: new Date().toISOString(),
  };

  const validationFlags = validateTrainingPlan(draftPlan);

  return {
    ...draftPlan,
    validationFlags,
  };
}
