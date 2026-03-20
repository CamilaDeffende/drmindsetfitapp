import {
  AdherenceProfile,
  AdaptationAction,
  EquipmentProfile,
  ExerciseComplexity,
  MovementPattern,
  ProgressionType,
  RecoveryProfile,
  SafetySeverity,
  SessionFocus,
  TrainingGoal,
  TrainingLevel,
  TrainingSplitType,
} from "./enums";

export type OnboardingTrainingInput = {
  age?: number;
  objective?: string;
  primaryGoal?: string;
  secondaryGoal?: string;
  experienceLevel?: string;
  weeklyDays?: number;
  availableDays?: number;
  sessionDurationMin?: number;
  availableEquipment?: string[];
  constraints?: string[];
  limitations?: string[];
  painFlags?: string[];
  environment?: string;
  modality?: string;
  sleepQualityScore?: number;
  stressScore?: number;
  recoveryScore?: number;
  adherenceHistoryScore?: number;
  monthsDetrained?: number;
  trainingExperienceMonths?: number;
  runningInterest?: boolean;
  cyclingInterest?: boolean;
  cardioInterest?: boolean;
};

export type TrainingProfile = {
  goal: TrainingGoal;
  primaryGoal?: TrainingGoal;
  level: TrainingLevel;
  recoveryProfile: RecoveryProfile;
  recoveryLevel?: RecoveryProfile;
  adherenceProfile: AdherenceProfile;
  adherenceLevel?: AdherenceProfile;
  equipmentProfile: EquipmentProfile;
  weeklyDays: number;
  availableDays?: number;
  sessionDurationMin: number;
  constraints: string[];
  environment: string;
  preferredModality: string;
  cardioCompatible?: boolean;
  hybridCandidate?: boolean;
};

export type ExerciseDefinition = {
  id: string;
  name: string;
  movementPattern: MovementPattern;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  equipmentTags: string[];
  environmentTags?: string[];
  complexity: ExerciseComplexity;
  difficultyScore?: number;
  unilateral?: boolean;
  homeFriendly?: boolean;
};

export type Exercise = ExerciseDefinition;

export type ExercisePrescription = {
  exerciseId: string;
  exerciseName: string;
  name?: string;
  sets: number;
  repRange: string;
  restSec: number;
  targetRir: number;
  notes?: string[];
};

export type PrescribedExercise = ExercisePrescription;

export type SessionPlan = {
  dayIndex: number;
  name?: string;
  focus: SessionFocus;
  estimatedDurationMin: number;
  exercises: ExercisePrescription[];
  rationale: string[];
};

export type TrainingSession = SessionPlan;

export type SessionTemplate = {
  split: string;
  focus: SessionFocus;
  requiredPatterns: MovementPattern[];
  optionalPatterns?: MovementPattern[];
  estimatedDurationMin?: number;
};

export type WeeklyTemplate = {
  split: TrainingSplitType;
  days: SessionFocus[];
};

export type CardioPrescription = {
  modality: string;
  frequencyPerWeek: number;
  durationMin: number;
  intensity: string;
};

export type ProgressionModel = {
  type: ProgressionType;
  notes: string[];
};

export type TrainingBlock = {
  weeks: number;
  progressionModel: "DOUBLE_PROGRESSION" | "LOAD_PROGRESSION" | "DENSITY";
  deloadWeek?: number | null;
};

export type TrainingPlan = {
  profile: TrainingProfile;
  split: TrainingSplitType;
  weeklyVolumeTarget: number;
  weeklyVolumeByMuscle: Record<string, number>;
  sessions: SessionPlan[];
  cardioPlan: string[];
  cardioPrescription?: CardioPrescription;
  block: TrainingBlock;
  rationale: string[];
  warnings: string[];
  validations: string[];
  createdAt?: string;
  version: number;
};

export type TrainingFeedbackInput = {
  sessionScore?: number;
  adherencePct?: number;
  perceivedRecovery?: number;
  timeConstraintMin?: number;
  flaggedExercises?: string[];
};

export type AdaptationDecision = {
  actions: AdaptationAction[];
  recommendedLoadAdjustmentPct: number;
  recommendedVolumeAdjustmentPct: number;
  rationale: string[];
  confidence: number;
};

export type ValidationResult = {
  valid: boolean;
  messages: string[];
};

export type SafetyFlag = {
  severity: SafetySeverity;
  message: string;
};
