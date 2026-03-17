import {
  AdherenceLevel,
  MovementPattern,
  ProgressionType,
  RecoveryLevel,
  SafetySeverity,
  SessionBlockType,
  TrainingEnvironment,
  TrainingGoal,
  TrainingLevel,
  TrainingSplit,
} from "./enums";

export interface OnboardingTrainingInput {
  age: number;
  sex: string;
  heightCm: number;
  weightKg: number;
  primaryGoal: TrainingGoal;
  secondaryGoal?: TrainingGoal;
  availableDays: number;
  sessionDurationMin: number;
  trainingExperienceMonths: number;
  monthsDetrained: number;
  preferredEnvironment: TrainingEnvironment;
  availableEquipment: string[];
  preferredModalities: string[];
  dislikedExercises: string[];
  favoriteExercises: string[];
  sleepQualityScore: number;
  stressLevelScore: number;
  dailyEnergyScore: number;
  recoveryPerceptionScore: number;
  cardioInterest: boolean;
  runningInterest: boolean;
  cyclingInterest: boolean;
  bodyFocusAreas: string[];
  limitations: string[];
  painFlags: string[];
}

export interface SafetyFlag {
  code: string;
  severity: SafetySeverity;
  message: string;
}

export interface Exercise {
  id: string;
  name: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  movementPattern: MovementPattern;
  equipment: string[];
  environmentTags: TrainingEnvironment[];
  technicalLevel: TrainingLevel;
  difficultyScore: number;
  isCompound: boolean;
  substitutions: string[];
  executionCues: string[];
}

export interface PrescribedExercise {
  exerciseId: string;
  name: string;
  blockType: SessionBlockType;
  sets: number;
  reps?: string;
  durationSec?: number;
  restSec: number;
  rir?: number;
  rpe?: number;
  rationale?: string;
}

export interface TrainingSession {
  id: string;
  name: string;
  focus: string;
  estimatedDurationMin: number;
  exercises: PrescribedExercise[];
  rationale?: string;
}

export interface WeeklyTemplateDay {
  dayIndex: number;
  name: string;
  focus: string;
  requiredPatterns: MovementPattern[];
  targetDurationMin: number;
  targetVolume: Record<string, number>;
}

export interface WeeklyTemplate {
  name: string;
  split: TrainingSplit;
  days: WeeklyTemplateDay[];
}

export interface SessionTemplate {
  name: string;
  split: TrainingSplit;
  dayIndex: number;
  focus: string;
  requiredPatterns: MovementPattern[];
  volumeTarget: Record<string, number>;
  targetDurationMin: number;
}

export interface VolumeDistributionResult {
  weeklyVolumeByMuscle: Record<string, number>;
}

export interface ProgressionModel {
  type: ProgressionType;
  strategyLabel: string;
  deloadEveryWeeks?: number;
  notes: string[];
}

export interface CardioPrescription {
  type: "steady" | "interval";
  modality: string;
  minutes: number;
  rationale: string;
}

export interface TrainingProfile {
  level: TrainingLevel;
  recoveryLevel: RecoveryLevel;
  adherenceLevel: AdherenceLevel;
  primaryGoal: TrainingGoal;
  secondaryGoal?: TrainingGoal;
  environment: TrainingEnvironment;
  availableDays: number;
  sessionDurationMin: number;
  equipmentTierScore: number;
  recoveryScore: number;
  adherenceScore: number;
  timeConstraintScore: number;
  complexityToleranceScore: number;
  cardioCompatible: boolean;
  hybridCandidate: boolean;
  bodyFocusAreas: string[];
  restrictions: string[];
  excludedExercises: string[];
  rationale: string[];
}

export interface TrainingPlan {
  id: string;
  profile: TrainingProfile;
  split: TrainingSplit;
  sessions: TrainingSession[];
  weeklyVolumeByMuscle: Record<string, number>;
  cardioPlan?: CardioPrescription[];
  progressionModel: ProgressionModel;
  validationFlags: SafetyFlag[];
  rationale: string[];
  version: number;
  createdAt: string;
}

export interface TrainingFeedbackEntry {
  sessionId?: string;
  completed: boolean;
  perceivedEffort?: number;
  recoveryScore?: number;
  fatigueScore?: number;
  durationCompletedMin?: number;
  notes?: string;
  createdAt: string;
}

export interface FeedbackAnalysis {
  recoveryTrend: number;
  fatigueTrend: number;
  adherenceTrend: number;
  shouldReduceVolume: boolean;
  shouldCompressTime: boolean;
  notes: string[];
}
