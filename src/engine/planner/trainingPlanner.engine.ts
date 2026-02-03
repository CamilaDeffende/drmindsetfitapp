import cyclingLib from "../training_library/cycling/cycling_bike_indoor.v1.json";
import { buildWeeklyPlan } from "../periodization/weeklyPeriodization.engine";
import { resolveHybridLoad } from "../motors/hybridRunningCycling.engine";

type Level = "iniciante" | "intermediario" | "avancado";
type Goal = "emagrecimento" | "performance" | "condicionamento";

type Modality = "cycling" | "running" | "strength";

export type PlannerInput = {
  level: Level;
  goal: Goal;
  available_days: number; // 1..7
  modalities: Modality[]; // ex: ["running","cycling","strength"]
};

type Workout = {
  id: string;
  level: Level;
  name: string;
  goal: string;
  duration_minutes: number;
  intensity: { perceived_exertion: string; cadence_rpm: string };
  execution: string[];
  focus: string;
  cues: string[];
  common_errors: string[];
  variations: string[];
};

type DayKey = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

export type PlannedSession = {
  modality: Modality;
  tag: string; // endurance, intervalado, torque, regenerativo, progressivo...
  workout_id?: string; // cycling id
  title: string;
  pse_hint?: number; // heuristic
};

export type WeeklyPlanOutput = Record<DayKey, PlannedSession | null>;

function parsePSE(pseStr: string): number {
  // "8-9" -> 9, "4-6" -> 6, "6" -> 6
  const s = (pseStr || "").trim();
  const m = s.match(/^(\d+)\s*-\s*(\d+)$/);
  if (m) return Number(m[2]);
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

function tagFromNameAndCadence(w: Workout): string {
  const name = (w.name || "").toLowerCase();
  const pse = parsePSE(w.intensity?.perceived_exertion || "");
  const cadence = (w.intensity?.cadence_rpm || "").toLowerCase();

  if (name.includes("regener")) return "regenerativo";
  if (name.includes("torque") || name.includes("força") || cadence.includes("55") || cadence.includes("60")) return "torque";
  if (name.includes("hiit") || name.includes("sprint") || pse >= 9) return "hiit";
  if (name.includes("interval")) return "intervalado";
  if (name.includes("progress")) return "progressivo";
  if (name.includes("endurance") || name.includes("base")) return "endurance";
  return "geral";
}

function pickCycling(level: Level, preferTags: string[], bannedIds: Set<string>): Workout {
  const all = (cyclingLib as any).workouts as Workout[];
  const pool = all.filter(w => w.level === level && !bannedIds.has(w.id));

  // ordena por preferência de tags
  for (const t of preferTags) {
    const found = pool.find(w => tagFromNameAndCadence(w) === t);
    if (found) return found;
  }

  // fallback: primeiro da pool
  if (pool.length) return pool[0];
  // fallback extremo (não deveria acontecer)
  return all[0];
}

function mapTemplateTagToCyclingPrefs(template: string, goal: Goal): string[] {
  // template vem do weeklyPeriodization (ex: cycling_endurance_base)
  // goal ajusta prioridade
  const g = goal;
  if (template.includes("regener")) return ["regenerativo", "endurance", "geral"];
  if (template.includes("interval")) {
    return g === "performance"
      ? ["hiit", "intervalado", "progressivo"]
      : ["intervalado", "progressivo", "endurance"];
  }
  if (template.includes("progress")) return ["progressivo", "intervalado", "endurance"];
  if (template.includes("endurance")) return ["endurance", "progressivo", "geral"];
  return ["geral", "endurance", "progressivo"];
}

function heurPseForTag(tag: string): number {
  if (tag === "hiit") return 9;
  if (tag === "intervalado") return 8;
  if (tag === "torque") return 8;
  if (tag === "progressivo") return 7;
  if (tag === "endurance") return 6;
  if (tag === "regenerativo") return 4;
  return 6;
}

export function planWeek(input: PlannerInput): WeeklyPlanOutput {
  const dayTemplate = buildWeeklyPlan({
    level: input.level,
    goal: input.goal,
    available_days: input.available_days
  });

  const out: WeeklyPlanOutput = {
    monday: null, tuesday: null, wednesday: null, thursday: null, friday: null, saturday: null, sunday: null
  };

  const days: DayKey[] = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"];
  const bannedCyclingIds = new Set<string>();

  // Regras de carga semana:
  let hardCount = 0;
  let prevWasHard = false;
  let endurancePlaced = false;

  for (const d of days) {
    const t = (dayTemplate as any)[d] as string | undefined;
    if (!t) continue;

    // decide modalidade do dia por template
    if (t.startsWith("cycling_") && input.modalities.includes("cycling")) {
      const prefs = mapTemplateTagToCyclingPrefs(t, input.goal);
      let chosen = pickCycling(input.level, prefs, bannedCyclingIds);
      let tag = tagFromNameAndCadence(chosen);
      let pse = parsePSE(chosen.intensity.perceived_exertion);

      // regra: máximo 2 hard (pse>=8) e não consecutivo
      const isHard = pse >= 8 || tag === "hiit" || tag === "torque" || tag === "intervalado";
      if (isHard) {
        if (hardCount >= 2 || prevWasHard) {
          // rebaixar para endurance/regenerativo
          chosen = pickCycling(input.level, ["endurance", "regenerativo", "progressivo"], bannedCyclingIds);
          tag = tagFromNameAndCadence(chosen);
          pse = parsePSE(chosen.intensity.perceived_exertion);
        }
      }

      // marca
      bannedCyclingIds.add(chosen.id);
      const finalTag = tag;
      const finalPse = parsePSE(chosen.intensity.perceived_exertion) || heurPseForTag(finalTag);

      if (finalTag === "endurance") endurancePlaced = true;
      const finalIsHard = finalPse >= 8 || finalTag === "hiit" || finalTag === "intervalado" || finalTag === "torque";
      if (finalIsHard) hardCount++;
      prevWasHard = finalIsHard;

      out[d] = {
        modality: "cycling",
        tag: finalTag,
        workout_id: chosen.id,
        title: chosen.name,
        pse_hint: finalPse
      };
      continue;
    }

    if (t.startsWith("running_") && input.modalities.includes("running")) {
      // placeholder: o catálogo de corrida já existe no teu engine; aqui só “tag” (integração real vem no próximo bloco)
      const tag = t.replace("running_", "");
      const pse = tag.includes("interval") ? 8 : tag.includes("progress") ? 7 : 6;

      // híbrido: se corrida é hard, ciclismo do dia (se existisse) vira leve. Aqui mantemos regra interna.
      const hybrid = resolveHybridLoad({ running_pse: pse });
      out[d] = {
        modality: "running",
        tag,
        title: `Corrida: ${tag}`,
        pse_hint: hybrid.cycling === "leve_ou_regenerativo" ? pse : pse
      };
      prevWasHard = pse >= 8;
      if (prevWasHard) hardCount++;
      continue;
    }

    if (t.startsWith("strength") && input.modalities.includes("strength")) {
      out[d] = {
        modality: "strength",
        tag: t,
        title: t === "strength_full_body" ? "Musculação: Full Body" : "Musculação: Complementar",
        pse_hint: 6
      };
      prevWasHard = false;
      continue;
    }

    // fallback: recuperação ativa
    out[d] = { modality: "cycling", tag: "regenerativo", title: "Recuperação Ativa", pse_hint: 4 };
    prevWasHard = false;
  }

  // regra: se dias >=3 e não colocou endurance, força um endurance no primeiro dia ciclismo
  if (input.available_days >= 3 && !endurancePlaced && input.modalities.includes("cycling")) {
    for (const d of days) {
      const s = out[d];
      if (s?.modality === "cycling") {
        // troca por endurance
        const chosen = pickCycling(input.level, ["endurance", "progressivo", "geral"], new Set());
        out[d] = {
          modality: "cycling",
          tag: tagFromNameAndCadence(chosen),
          workout_id: chosen.id,
          title: chosen.name,
          pse_hint: parsePSE(chosen.intensity.perceived_exertion) || 6
        };
        break;
      }
    }
  }

  return out;
}
