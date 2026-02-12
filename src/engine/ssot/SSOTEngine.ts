import type { SSOTInputs, SSOTOutputs, SSOTWarnings, Goal } from "./types";
import { calculateREEAuto } from "@/services/nutrition/energyEquations";
import { objectiveDeltaKcal } from "@/services/nutrition/engine/nutritionEngine";

const STORAGE_KEY = "drmindsetfit_state";

function nowIso() {
  try { return new Date().toISOString(); } catch { return "unknown"; }
}
function round(n: number) {
  return Math.round(Number.isFinite(n) ? n : 0);
}

function clampActivityFactor(x: number) {
  const min = 1.0;
  const max = 2.4;
  const raw = Number.isFinite(x) ? x : 0;
  const clamped = Math.min(max, Math.max(min, raw || min));
  return { min, max, raw, clamped, applied: clamped !== raw && Number.isFinite(raw) };
}

function computeActivityFactor(input: SSOTInputs, warnings: SSOTWarnings[]) {
  const explicit = input.activity?.activityFactor;
  if (Number.isFinite(explicit as number) && (explicit as number) > 0) {
    const c = clampActivityFactor(Number(explicit));
    if (c.applied) warnings.push({ code: "clamp_applied", message: `Clamp aplicado no fator de atividade (${c.raw}→${c.clamped}).` });
    return { activityFactor: c.clamped, raw: c.raw, source: "explicit" as const, clamp: c };
  }

  const freq = input.activity?.frequencyPerWeek;
  if (!freq) warnings.push({ code: "missing_freq", message: "Frequência semanal ausente. Usando fator padrão." });

  const f = Number(freq || 0);
  let base = 1.35;
  if (f >= 1 && f <= 2) base = 1.45;
  if (f >= 3 && f <= 4) base = 1.60;
  if (f >= 5 && f <= 6) base = 1.75;
  if (f >= 7) base = 1.90;

  warnings.push({ code: "fallback_used", message: "Fator de atividade por fallback (freq semanal). Refinaremos por modalidade na fase seguinte." });

  const c = clampActivityFactor(base);
  return { activityFactor: c.clamped, raw: c.raw, source: "fallback_freq" as const, clamp: c };
}

function normalizeGoal(g?: Goal): Goal | undefined {
  if (!g) return undefined;
  if (g === "cut" || g === "maintain" || g === "bulk") return g;
  return undefined;
}

export function computeSSOT(inputs: SSOTInputs): SSOTOutputs {
  const warnings: SSOTWarnings[] = [];

  const p = inputs.profile || {};
  const hasBase = Boolean(p.weightKg && p.heightCm && p.age);
  if (!hasBase) warnings.push({ code: "missing_profile", message: "Perfil incompleto (peso/altura/idade). SSOT calculou com defaults seguros." });

  const weightKg = Number(p.weightKg || 0);
  const heightCm = Number(p.heightCm || 0);
  const age = Number(p.age || 0);
  const sex = (p.sex || "unknown").toString();

  const ffm = Number(inputs.bodyComp?.ffmKg || 0);
  const athlete = Boolean(p.athlete);

  const auto = calculateREEAuto({
    pesoKg: weightKg,
    alturaCm: heightCm,
    idade: age,
    sexo: sex,
    massaMagraKg: ffm || undefined,
    athlete
  } as any);

  const ree = round((auto as any)?.reeKcal ?? (auto as any)?.ree ?? 0);
  const reeMethod = String((auto as any)?.method ?? (auto as any)?.equation ?? "auto");

  if (!ree || ree < 800 || ree > 4500) warnings.push({ code: "extreme_values", message: `REE fora do esperado (${ree}). Verifique peso/altura/idade.` });

  const act = computeActivityFactor(inputs, warnings);
  const tdee = round(ree * act.activityFactor);

  const goal = normalizeGoal(inputs.nutrition?.goal);
  let target = tdee;

  const pct = inputs.nutrition?.strategyPercent;
  if (typeof pct === "number" && Number.isFinite(pct)) {
    target = round(tdee * (1 + pct));
  } else if (goal) {
    const delta = objectiveDeltaKcal(goal as any, tdee);
    target = round(tdee + delta);
  }

  const floorMin = round(Math.max(ree * 1.05, 1200));
  const ceilMax = round(Math.min(tdee * 1.25, tdee + 900));
  const ideal = target;
  const safeMin =  round(Math.max(Math.min(ideal, floorMin), floorMin));
  const safeMax = round(Math.max(ideal, Math.max(ideal, ceilMax)));

  let targetFinal = ideal;
  if (targetFinal < safeMin) {
    warnings.push({ code: "clamp_applied", message: `Target ajustado para faixa segura (${targetFinal}→${safeMin}).` });
    targetFinal = safeMin;
  }
  if (targetFinal > safeMax) {
    warnings.push({ code: "clamp_applied", message: `Target ajustado para faixa segura (${targetFinal}→${safeMax}).` });
    targetFinal = safeMax;
  }

  const trace = {
    timestamp: nowIso(),
    storageKey: STORAGE_KEY,
    reeMethod,
    reeKcal: ree,
    activityFactorRaw: act.raw,
    activityFactorFinal: act.activityFactor,
    tdeeKcal: tdee,
    goal,
    targetKcal: targetFinal,
    clamp: { min: act.clamp.min, max: act.clamp.max, applied: act.clamp.applied }
  };

  return {
    metabolic: { reeKcal: ree, activityFactor: act.activityFactor, tdeeKcal: tdee },
    nutrition: { targetKcal: targetFinal },
    safeRange: { min: safeMin, ideal: targetFinal, max: safeMax },
    audit: { trace, warnings }
  };
}
