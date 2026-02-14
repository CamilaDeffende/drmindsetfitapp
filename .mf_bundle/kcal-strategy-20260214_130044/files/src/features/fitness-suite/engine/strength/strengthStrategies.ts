import type { BiomechLevel, StrengthExercise } from "../../data/strength/strengthTypes";
import type { UserLevel } from "../../data/strength/strengthLibrary";

export type StrengthGoal = "hipertrofia" | "forca" | "recomposicao";

export type StrengthStrategyKind =
  | "straight_sets"
  | "rest_pause"
  | "back_off_set"
  | "drop_set"
  | "fts_7"
  | "piramidal_crescente"
  | "piramidal_decrescente"
  | "bi_set"
  | "tri_set"
  | "tut";

export type SetPrescription = {
  /** número da série (1..n) */
  set: number;
  /** reps alvo (ou faixa) */
  reps: number | { min: number; max: number };
  /** descanso em segundos */
  restSec: number;
  /** intensidade relativa (0..1) */
  intensity: number;
  /** notas curtas (ex: "tempo 3-1-1") */
  notes?: string[];
};

export type StrategyDefinition = {
  kind: StrengthStrategyKind;
  title: string;
  objective: string; // objetivo fisiológico
  /** compatibilidade por nível do usuário */
  allowedUserLevels: UserLevel[];
  /** compatibilidade por biomecânica do exercício */
  allowedBiomechLevels: BiomechLevel[];
  /** gera séries de forma determinística */
  build: (ctx: StrategyContext) => SetPrescription[];
};

export type StrategyContext = {
  userLevel: UserLevel;
  goal: StrengthGoal;
  exercise: StrengthExercise;
  /** base "segura" para o dia (ex: 3 séries) */
  baseSets: number;
  /** reps base por objetivo (ex: hipertrofia 8-12, força 4-6) */
  baseReps: { min: number; max: number };
  /** descanso base (segundos) */
  baseRestSec: number;
};

export function isStrategyCompatible(def: StrategyDefinition, ctx: StrategyContext): boolean {
  if (!def.allowedUserLevels.includes(ctx.userLevel)) return false;
  if (!def.allowedBiomechLevels.includes(ctx.exercise.biomechLevel)) return false;
  return true;
}

/**
 * Intensidade relativa (0..1) determinística por objetivo + nível.
 * Obs: é um "proxy" (não é 1RM), pensado para motor simples e previsível.
 */
export function baseIntensity(goal: StrengthGoal, userLevel: UserLevel): number {
  const byGoal: Record<StrengthGoal, number> = {
    hipertrofia: 0.72,
    forca: 0.82,
    recomposicao: 0.68,
  };
  const byLevel: Record<UserLevel, number> = {
    iniciante: -0.05,
    intermediario: 0,
    avancado: 0.03,
  };
  const v = byGoal[goal] + byLevel[userLevel];
  return Math.max(0.55, Math.min(0.9, v));
}

/**
 * Estratégias:
 * - Todas retornam séries/reps/descanso/intensidade + objetivo fisiológico.
 * - Gates fortes: iniciante não recebe agressivas/avançadas.
 * - Determinístico: sem random.
 */
export const STRATEGIES: Record<StrengthStrategyKind, StrategyDefinition> = {
  straight_sets: {
    kind: "straight_sets",
    title: "Séries retas",
    objective: "Padrão base com progressão simples e controle técnico.",
    allowedUserLevels: ["iniciante", "intermediario", "avancado"],
    allowedBiomechLevels: ["basico", "intermediario", "avancado"],
    build: (ctx) => {
      const intensity = baseIntensity(ctx.goal, ctx.userLevel);
      return Array.from({ length: ctx.baseSets }).map((_, i) => ({
        set: i + 1,
        reps: { ...ctx.baseReps },
        restSec: ctx.baseRestSec,
        intensity,
      }));
    },
  },

  // Intermediário+ : técnica e densidade
  rest_pause: {
    kind: "rest_pause",
    title: "Rest-Pause",
    objective: "Aumentar densidade e recrutamento com mini-pauses curtas.",
    allowedUserLevels: ["intermediario", "avancado"],
    allowedBiomechLevels: ["basico", "intermediario"], // evita avançados
    build: (ctx) => {
      const intensity = Math.min(0.88, baseIntensity(ctx.goal, ctx.userLevel) + 0.05);
      // 1 série “top” + 2 mini-blocos com descansos curtos
      return [
        { set: 1, reps: { min: ctx.baseReps.min, max: ctx.baseReps.max }, restSec: ctx.baseRestSec, intensity, notes: ["top set"] },
        { set: 2, reps: { min: 3, max: 6 }, restSec: 20, intensity: Math.min(0.9, intensity + 0.02), notes: ["mini-set 1 (rest-pause)"] },
        { set: 3, reps: { min: 2, max: 5 }, restSec: 20, intensity: Math.min(0.9, intensity + 0.02), notes: ["mini-set 2 (rest-pause)"] },
      ];
    },
  },

  back_off_set: {
    kind: "back_off_set",
    title: "Back-off Set",
    objective: "Top set mais pesado + back-off com volume para hipertrofia.",
    allowedUserLevels: ["intermediario", "avancado"],
    allowedBiomechLevels: ["basico", "intermediario"],
    build: (ctx) => {
      const base = baseIntensity(ctx.goal, ctx.userLevel);
      const top = Math.min(0.9, base + 0.07);
      const back = Math.max(0.6, base - 0.07);
      return [
        { set: 1, reps: { min: Math.max(3, ctx.baseReps.min - 2), max: Math.max(5, ctx.baseReps.min) }, restSec: ctx.baseRestSec + 30, intensity: top, notes: ["top set"] },
        { set: 2, reps: { min: ctx.baseReps.min + 2, max: ctx.baseReps.max + 2 }, restSec: ctx.baseRestSec, intensity: back, notes: ["back-off"] },
        { set: 3, reps: { min: ctx.baseReps.min + 2, max: ctx.baseReps.max + 2 }, restSec: ctx.baseRestSec, intensity: back, notes: ["back-off"] },
      ];
    },
  },

  // Avançado: agressivas, com gates ainda mais fortes
  drop_set: {
    kind: "drop_set",
    title: "Drop-set",
    objective: "Estresse metabólico e volume efetivo sem descanso longo.",
    allowedUserLevels: ["avancado"],
    allowedBiomechLevels: ["basico"], // só básico por segurança técnica
    build: (ctx) => {
      const base = baseIntensity(ctx.goal, ctx.userLevel);
      return [
        { set: 1, reps: { min: ctx.baseReps.min, max: ctx.baseReps.max }, restSec: ctx.baseRestSec, intensity: Math.min(0.9, base + 0.04), notes: ["set principal"] },
        { set: 2, reps: { min: 6, max: 10 }, restSec: 0, intensity: Math.max(0.6, base - 0.08), notes: ["drop 1 (reduzir carga ~15-25%)"] },
        { set: 3, reps: { min: 6, max: 10 }, restSec: 0, intensity: Math.max(0.55, base - 0.14), notes: ["drop 2 (reduzir carga ~15-25%)"] },
      ];
    },
  },

  fts_7: {
    kind: "fts_7",
    title: "FTS-7",
    objective: "Alta densidade (7 séries) com descanso curto para pump/metabólico.",
    allowedUserLevels: ["avancado"],
    allowedBiomechLevels: ["basico"], // segurança: movimento simples
    build: (ctx) => {
      const intensity = Math.max(0.6, baseIntensity(ctx.goal, ctx.userLevel) - 0.08);
      return Array.from({ length: 7 }).map((_, i) => ({
        set: i + 1,
        reps: { min: 8, max: 12 },
        restSec: 30,
        intensity,
        notes: ["descanso curto", "controle total"],
      }));
    },
  },

  piramidal_crescente: {
    kind: "piramidal_crescente",
    title: "Piramidal crescente",
    objective: "Aumentar carga gradualmente enquanto reduz reps.",
    allowedUserLevels: ["intermediario", "avancado"],
    allowedBiomechLevels: ["basico", "intermediario"],
    build: (ctx) => {
      const base = baseIntensity(ctx.goal, ctx.userLevel);
      const sets = Math.max(3, ctx.baseSets);
      return Array.from({ length: sets }).map((_, i) => ({
        set: i + 1,
        reps: { min: Math.max(3, ctx.baseReps.min - i), max: Math.max(6, ctx.baseReps.max - i) },
        restSec: ctx.baseRestSec,
        intensity: Math.min(0.9, base + i * 0.03),
        notes: ["subir carga gradualmente"],
      }));
    },
  },

  piramidal_decrescente: {
    kind: "piramidal_decrescente",
    title: "Piramidal decrescente",
    objective: "Começar pesado e reduzir carga aumentando reps.",
    allowedUserLevels: ["intermediario", "avancado"],
    allowedBiomechLevels: ["basico", "intermediario"],
    build: (ctx) => {
      const base = baseIntensity(ctx.goal, ctx.userLevel);
      const sets = Math.max(3, ctx.baseSets);
      return Array.from({ length: sets }).map((_, i) => ({
        set: i + 1,
        reps: { min: ctx.baseReps.min + i, max: ctx.baseReps.max + i },
        restSec: ctx.baseRestSec,
        intensity: Math.max(0.6, Math.min(0.9, base + 0.06 - i * 0.03)),
        notes: ["reduzir carga gradualmente"],
      }));
    },
  },

  bi_set: {
    kind: "bi_set",
    title: "Bi-set",
    objective: "Densidade + estímulo complementar com dois exercícios seguidos.",
    allowedUserLevels: ["intermediario", "avancado"],
    allowedBiomechLevels: ["basico", "intermediario"],
    build: (ctx) => {
      const intensity = baseIntensity(ctx.goal, ctx.userLevel);
      // Engine retorna a prescrição do exercício atual (o pairing vem no BLOCO 4)
      return [
        { set: 1, reps: { ...ctx.baseReps }, restSec: 15, intensity, notes: ["A1 (bi-set) — descanso curto antes do A2"] },
        { set: 2, reps: { ...ctx.baseReps }, restSec: ctx.baseRestSec, intensity, notes: ["A1 (bi-set) — após A2, descanso completo"] },
        { set: 3, reps: { ...ctx.baseReps }, restSec: ctx.baseRestSec, intensity, notes: ["A1 (bi-set)"] },
      ];
    },
  },

  tri_set: {
    kind: "tri_set",
    title: "Tri-set",
    objective: "Alta densidade com três movimentos em sequência.",
    allowedUserLevels: ["avancado"],
    allowedBiomechLevels: ["basico"],
    build: (ctx) => {
      const intensity = Math.max(0.6, baseIntensity(ctx.goal, ctx.userLevel) - 0.06);
      return [
        { set: 1, reps: { min: 10, max: 15 }, restSec: 10, intensity, notes: ["A1 (tri-set) — 10s e segue A2"] },
        { set: 2, reps: { min: 10, max: 15 }, restSec: 10, intensity, notes: ["A1 (tri-set) — 10s e segue A2"] },
        { set: 3, reps: { min: 10, max: 15 }, restSec: ctx.baseRestSec, intensity, notes: ["A1 (tri-set) — após A3, descanso completo"] },
      ];
    },
  },

  tut: {
    kind: "tut",
    title: "Tempo controlado (TUT)",
    objective: "Aumentar tempo sob tensão com cadência controlada.",
    allowedUserLevels: ["iniciante", "intermediario", "avancado"],
    allowedBiomechLevels: ["basico", "intermediario"],
    build: (ctx) => {
      const intensity = Math.max(0.6, baseIntensity(ctx.goal, ctx.userLevel) - 0.05);
      return Array.from({ length: ctx.baseSets }).map((_, i) => ({
        set: i + 1,
        reps: { ...ctx.baseReps },
        restSec: ctx.baseRestSec,
        intensity,
        notes: ["tempo 3-1-1 (excêntrica-pausa-concêntrica)"],
      }));
    },
  },
};

export function pickDefaultStrategy(userLevel: UserLevel): StrengthStrategyKind {
  if (userLevel === "iniciante") return "straight_sets";
  if (userLevel === "intermediario") return "piramidal_crescente";
  return "back_off_set";
}

/**
 * Escolhe estratégia determinística:
 * - respeita nível
 * - respeita biomecânica
 * - sem aleatoriedade
 */
export function resolveStrengthStrategy(ctx: StrategyContext): StrategyDefinition {
  const preferred = STRATEGIES[pickDefaultStrategy(ctx.userLevel)];
  if (isStrategyCompatible(preferred, ctx)) return preferred;

  // fallback permitido (NÃO é genérico de modalidade, é só “estratégia safe” de musculação)
  const safe = STRATEGIES.straight_sets;
  return safe;
}

/** Aplica estratégia e devolve prescrição final (sets) */
export function buildStrengthPrescription(ctx: StrategyContext): {
  strategy: StrategyDefinition;
  sets: SetPrescription[];
} {
  const strategy = resolveStrengthStrategy(ctx);
  const sets = strategy.build(ctx);
  return { strategy, sets };
}

/**
 * Gate extra (opcional) para exercícios compostos complexos:
 * - iniciante: nunca "avancado" (já garantido na lib)
 * - e evita estratégias agressivas em exercícios que exigem spotter
 */
export function clampForSafety(
  exercise: StrengthExercise,
  userLevel: UserLevel,
  goal: StrengthGoal,
  kind: StrengthStrategyKind
): StrengthStrategyKind {
  if (userLevel !== "avancado") {
    if (kind === "drop_set" || kind === "fts_7" || kind === "tri_set") return "straight_sets";
  }
  if (exercise.requiresSpotter && (kind === "drop_set" || kind === "fts_7")) return "back_off_set";
  // força: evitar TUT como default, mas permite se escolhido explicitamente no futuro
  if (goal === "forca" && kind === "tut") return "straight_sets";
  return kind;
}
