import cyclingLib from "../training_library/cycling/cycling_bike_indoor.v1.json";
import { buildWeeklyPlan } from "../periodization/weeklyPeriodization.engine";
import { generateRunningWeek } from "@/modules/running";

// type derivado do export real (evita drift de unions)
type RunningReq = Parameters<typeof generateRunningWeek>[0];
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
      // corrida REAL via módulo running
      // map goal do planner -> objetivo de corrida (conservador)
      const goalMap: Record<Goal, RunningReq["goal"]> = {
        emagrecimento: "5K",
        condicionamento: "10K",
        performance: "21K"
      };

      // map level do planner -> level do running module
      const levelMap: Record<Level, RunningReq["level"]> = {
        iniciante: "INICIANTE",
        intermediario: "INTERMEDIARIO",
        avancado: "AVANCADO"
      };

      const daysPerWeek = Math.min(6, Math.max(3, input.available_days)) as 3|4|5|6;

            const req: RunningReq = {
        level: levelMap[input.level],
        goal: goalMap[input.goal],
        daysPerWeek,
        weekIndex: 1,
        hasStrength: input.modalities.includes("strength")
      };

      const week = generateRunningWeek(req);
const w = pickRunningDayFromWeek(week as any, d);

      // fallback se não casou dia: pega 1ª sessão
      const w0 = w || (week as any)?.sessions?.[0]?.workout || null;

      const planned = runningSessionToPlanned(w0);

      // regra: hardCount max 2 e não consecutivo
      const isHard = (planned.pse_hint || 0) >= 8;
      if (isHard) {
        if (hardCount >= 2 || prevWasHard) {
          planned.tag = "regenerativo";
          planned.title = "Corrida: Regenerativo";
          planned.pse_hint = 4;
        }
      }

      out[d] = planned;
      prevWasHard = (out[d]?.pse_hint || 0) >= 8;
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


function runningTagToPse(tag: string): number {
  // conservador e estável
  if (tag.includes("interval")) return 8;
  if (tag.includes("tempo")) return 7;
  if (tag.includes("progress")) return 7;
  if (tag.includes("long")) return 6;
  if (tag.includes("regen")) return 4;
  return 6;
}

function runningSessionToPlanned(w: any) {
  const title = w?.title || "Corrida";
  const tag = (w?.type || "running").toString().toLowerCase();
  const pse = runningTagToPse(tag);
  return { modality: "running" as const, tag, title, pse_hint: pse };
}

function pickRunningDayFromWeek(week: any, dayKey: string) {
  // week.sessions: [{dayLabel, workout}]
  const sessions = week?.sessions || [];
  // tenta casar por dayKey (monday..sunday) -> labels SEG/TER/...
  const map: Record<string,string> = {
    monday:"SEG", tuesday:"TER", wednesday:"QUA", thursday:"QUI", friday:"SEX", saturday:"SAB", sunday:"DOM"
  };
  const want = map[dayKey] || "";
  const hit = sessions.find((x:any)=> (x?.dayLabel||"") === want);
  return hit?.workout || null;
}
