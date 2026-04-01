import { SessionFocus, MovementPattern } from "../core/enums";
import { ExerciseDefinition, TrainingProfile } from "../core/types";
import { EXERCISES } from "../library/exercises";
import { SESSION_TEMPLATES } from "../library/sessionTemplates";

function compatible(exercise: ExerciseDefinition, profile: TrainingProfile): boolean {
  if (profile.equipmentProfile === "BODYWEIGHT") {
    return exercise.equipmentTags.includes("bodyweight") || exercise.homeFriendly === true;
  }

  if (profile.equipmentProfile === "BASIC_HOME") {
    return exercise.equipmentTags.some((tag) => ["bodyweight", "dumbbell", "bench", "bike", "kettlebell"].includes(tag));
  }

  return true;
}

function buildSelectionSeed(focus: SessionFocus, profile: TrainingProfile, dayIndex: number) {
  return [
    focus,
    profile.goal,
    profile.level,
    profile.equipmentProfile,
    profile.weeklyDays,
    profile.sessionDurationMin,
    dayIndex,
  ].join("|");
}

function hashString(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function getTargetExerciseCount(profile: TrainingProfile): number {
  let target = 7;

  if (
    String(profile.level).includes("INTERMEDIATE") ||
    String(profile.level).includes("ADVANCED")
  ) {
    target += 1;
  }

  if (profile.sessionDurationMin >= 55) target += 1;
  if (profile.sessionDurationMin >= 75) target += 1;
  if (profile.sessionDurationMin >= 90) target += 1;
  if (profile.sessionDurationMin <= 35) target -= 2;
  if (profile.sessionDurationMin <= 45) target -= 1;

  return Math.max(5, Math.min(target, 10));
}

function getTemplatePatterns(focus: SessionFocus) {
  const template = SESSION_TEMPLATES.find((item) => item.focus === focus);
  if (!template) {
    return {
      requiredPatterns: [
        MovementPattern.SQUAT,
        MovementPattern.HORIZONTAL_PUSH,
        MovementPattern.HORIZONTAL_PULL,
      ],
      optionalPatterns: [MovementPattern.CORE_ANTI_EXTENSION],
    };
  }

  return {
    requiredPatterns: template.requiredPatterns ?? [],
    optionalPatterns: template.optionalPatterns ?? [],
  };
}

function getPatternCandidates(pattern: MovementPattern): MovementPattern[] {
  const aliases: Record<string, MovementPattern[]> = {
    [MovementPattern.HIP_HINGE]: [MovementPattern.HIP_HINGE, MovementPattern.HINGE],
    [MovementPattern.HINGE]: [MovementPattern.HINGE, MovementPattern.HIP_HINGE],
    [MovementPattern.CORE_ANTI_EXTENSION]: [MovementPattern.CORE_ANTI_EXTENSION, MovementPattern.CORE],
    [MovementPattern.CORE_ANTI_ROTATION]: [MovementPattern.CORE_ANTI_ROTATION, MovementPattern.CORE],
    [MovementPattern.CARDIO_INTERVAL]: [MovementPattern.CARDIO_INTERVAL, MovementPattern.CARDIO],
  };

  return aliases[pattern] ?? [pattern];
}

function findMatchesForPattern(
  pool: ExerciseDefinition[],
  pattern: MovementPattern,
  usedIds: Set<string>
) {
  const acceptedPatterns = new Set(getPatternCandidates(pattern));
  return pool.filter(
    (item) => acceptedPatterns.has(item.movementPattern) && !usedIds.has(item.id)
  );
}

function scoreForProfile(exercise: ExerciseDefinition, profile: TrainingProfile) {
  const tags = new Set(exercise.equipmentTags);
  let score = 0;

  if (profile.equipmentProfile === "FULL_GYM") {
    if (tags.has("machine")) score += 4;
    if (tags.has("cable")) score += 3;
    if (tags.has("barbell")) score += 3;
    if (tags.has("dumbbell")) score += 2;
    if (tags.has("bench")) score += 1;
    if (tags.has("bodyweight")) score -= 2;
  }

  if (profile.equipmentProfile === "BASIC_HOME") {
    if (tags.has("dumbbell")) score += 3;
    if (tags.has("bench")) score += 2;
    if (tags.has("kettlebell")) score += 2;
    if (tags.has("bodyweight")) score += 2;
    if (tags.has("machine") || tags.has("cable") || tags.has("barbell")) score -= 3;
  }

  if (profile.equipmentProfile === "BODYWEIGHT") {
    if (tags.has("bodyweight")) score += 4;
    if (exercise.homeFriendly) score += 2;
    if (tags.has("machine") || tags.has("cable") || tags.has("barbell")) score -= 4;
  }

  return score;
}

function pickDeterministicExercise(
  matches: ExerciseDefinition[],
  focus: SessionFocus,
  profile: TrainingProfile,
  dayIndex: number,
  pattern: MovementPattern,
  seedLabel: string
) {
  if (!matches.length) return null;
  const ranked = [...matches].sort((a, b) => {
    const scoreDelta = scoreForProfile(b, profile) - scoreForProfile(a, profile);
    if (scoreDelta !== 0) return scoreDelta;
    return a.id.localeCompare(b.id);
  });
  const seed = hashString(
    buildSelectionSeed(focus, profile, dayIndex) + `|${pattern}|${seedLabel}`
  );
  return ranked[seed % ranked.length] ?? null;
}

export function selectExercises(
  focus: SessionFocus,
  profile: TrainingProfile,
  dayIndex = 0
): ExerciseDefinition[] {
  const pool = EXERCISES.filter((item) => compatible(item, profile));
  const usedIds = new Set<string>();
  const { requiredPatterns, optionalPatterns } = getTemplatePatterns(focus);
  const selected: ExerciseDefinition[] = [];
  const targetCount = getTargetExerciseCount(profile);

  for (const [patternIndex, pattern] of requiredPatterns.entries()) {
    const matches = findMatchesForPattern(pool, pattern, usedIds);
    const picked = pickDeterministicExercise(
      matches,
      focus,
      profile,
      dayIndex,
      pattern,
      `required-${patternIndex}`
    );

    if (!picked) continue;
    usedIds.add(picked.id);
    selected.push(picked);
  }

  for (const [patternIndex, pattern] of optionalPatterns.entries()) {
    if (selected.length >= targetCount) break;

    const matches = findMatchesForPattern(pool, pattern, usedIds);
    const picked = pickDeterministicExercise(
      matches,
      focus,
      profile,
      dayIndex,
      pattern,
      `optional-${patternIndex}`
    );

    if (!picked) continue;
    usedIds.add(picked.id);
    selected.push(picked);
  }

  const repeatablePatterns = [...requiredPatterns, ...optionalPatterns];
  let fillerIndex = 0;

  while (selected.length < targetCount && fillerIndex < repeatablePatterns.length * 2) {
    const pattern = repeatablePatterns[fillerIndex % repeatablePatterns.length];
    const matches = findMatchesForPattern(pool, pattern, usedIds);
    const picked = pickDeterministicExercise(
      matches,
      focus,
      profile,
      dayIndex,
      pattern,
      `filler-${fillerIndex}`
    );

    fillerIndex += 1;

    if (!picked) continue;
    usedIds.add(picked.id);
    selected.push(picked);
  }

  return selected;
}
