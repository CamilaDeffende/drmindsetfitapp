import { mfAudit, type MFWarn } from "@/services/audit/mfAudit";
import { applyNutritionGuardrails } from "@/services/nutrition/guardrails";
// MF_NUTRITION_ENGINE_V1
// Motor nutricional puro: REE/TDEE/macros + heurística de biotipo (sem pseudociência).
// Regras: funções puras, sem side-effects, sem depender de store/UI.

export type Sex = "masculino" | "feminino";
export type Goal = "emagrecimento" | "manutencao" | "ganho";
export type Biotype = "ectomorfo" | "mesomorfo" | "endomorfo";

export type BodyInput = {
  sexo: Sex;
  idade: number;      // anos
  pesoKg: number;     // kg
  alturaCm: number;   // cm
  massaMagraKg?: number | null; // opcional (bioimpedância / dobras)
};

export type ActivityLevel =
  | "sedentario"
  | "leve"
  | "moderado"
  | "alto"
  | "muito_alto";

export type EngineOptions = {
  objetivo: Goal;
  biotipo?: Biotype | null;
  atividade: ActivityLevel;
  // para precisão: permite override do déficit/superávit (kcal)
  deltaKcalOverride?: number | null;
};

export type Macros = {
  kcal: number;
  proteina_g: number;
  carbo_g: number;
  gordura_g: number;
  fibras_g: number;
};

export type NutritionPlan = {
  ree_kcal: number;
  tdee_kcal: number;
  alvo_kcal: number;
  metodo_ree: "mifflin" | "cunningham";
  fator_atividade: number;
  delta_objetivo_kcal: number;
  macros: Macros;
  notas: string[];
};

// ---------- helpers ----------
function clamp(n: number, a: number, b: number) {
  return Math.min(b, Math.max(a, n));
}
function round(n: number) {
  return Math.round(n);
}

export function activityFactor(level: ActivityLevel): number {
  // faixas típicas em apps; suficiente p/ produção (ajustável depois)
  switch (level) {
    case "sedentario": return 1.20;
    case "leve": return 1.35;
    case "moderado": return 1.55;
    case "alto": return 1.75;
    case "muito_alto": return 1.90;
    default: return 1.55;
  }
}

export function reeMifflin(input: BodyInput): number {
  const { sexo, pesoKg, alturaCm, idade } = input;
  const s = sexo === "masculino" ? 5 : -161;
  // Mifflin-St Jeor (kcal/d)
  return (10 * pesoKg) + (6.25 * alturaCm) - (5 * idade) + s;
}

export function reeCunningham(massaMagraKg: number): number {
  // Cunningham (kcal/d)
  return 500 + (22 * massaMagraKg);
}

export function computeREE(input: BodyInput): { ree: number; metodo: "mifflin" | "cunningham"; notas: string[] } {
  const notas: string[] = [];
  const mm = input.massaMagraKg ?? null;

  // Só usa Cunningham se massa magra for plausível
  if (typeof mm === "number" && isFinite(mm) && mm > 20 && mm < 120) {
    notas.push("REE por Cunningham (massa magra informada).");
    return { ree: reeCunningham(mm), metodo: "cunningham", notas };
  }
  notas.push("REE por Mifflin-St Jeor (default).");
  return { ree: reeMifflin(input), metodo: "mifflin", notas };
}

export function objectiveDeltaKcal(goal: Goal, tdee: number): number {
  // deltas conservadores e seguros para app (ajustáveis por protocolo)
  // emagrecimento: ~15–25% (limitado)
  // ganho: ~5–12% (limitado)
  if (goal === "manutencao") return 0;

  if (goal === "emagrecimento") {
    const delta = -0.20 * tdee;
    return clamp(delta, -750, -250);
  }

  // ganho
  const delta = 0.08 * tdee;
  return clamp(delta, 150, 450);
}

export function proteinTargetG(goal: Goal, pesoKg: number): number {
  // Faixas práticas: emag 1.8–2.2; manutenção 1.6–2.0; ganho 1.6–2.0
  const perKg =
    goal === "emagrecimento" ? 2.0 :
    goal === "ganho" ? 1.8 :
    1.7;
  return perKg * pesoKg;
}

export function fatTargetG(biotype: Biotype | null | undefined, alvoKcal: number): number {
  // Gordura mínima para adesão/hormonal: 0.7g/kg seria melhor com peso, mas aqui
  // usamos % kcal + ajuste heurístico por biotipo.
  // Base: 25% kcal; Endo: 28%; Ecto: 22%; Meso: 25%
  const pct =
    biotype === "endomorfo" ? 0.28 :
    biotype === "ectomorfo" ? 0.22 :
    0.25;
  const g = (pct * alvoKcal) / 9;
  return g;
}

export function carbTargetG(
  biotype: Biotype | null | undefined,
  alvoKcal: number,
  proteinG: number,
  fatG: number
): number {
  const kcalRest = alvoKcal - (proteinG * 4) - (fatG * 9);
  const baseCarb = Math.max(0, kcalRest) / 4;

  // heurística suave (não “biologia mágica”): muda só a distribuição, não o total
  // Endo: levemente menos carbo, ecto: levemente mais carbo, meso: neutro
  const mult =
    biotype === "endomorfo" ? 0.92 :
    biotype === "ectomorfo" ? 1.06 :
    1.00;

  return baseCarb * mult;
}

export function fiberTargetG(alvoKcal: number): number {
  // regra simples: 14g/1000 kcal, com teto/piso razoáveis
  return clamp((alvoKcal / 1000) * 14, 25, 45);
}

export function buildNutritionPlan(input: BodyInput, opts: EngineOptions): NutritionPlan {
  const notas: string[] = [];

  const { ree, metodo, notas: n0 } = computeREE(input);
  notas.push(...n0);

  const fator = activityFactor(opts.atividade);
  const tdee = ree * fator;

  const delta = (typeof opts.deltaKcalOverride === "number" && isFinite(opts.deltaKcalOverride))
    ? opts.deltaKcalOverride
    : objectiveDeltaKcal(opts.objetivo, tdee);

  if (opts.deltaKcalOverride != null) notas.push("Delta kcal override aplicado.");

  const alvo = tdee + delta;

  const pG = proteinTargetG(opts.objetivo, input.pesoKg);
  const fG = fatTargetG(opts.biotipo ?? null, alvo);
  // Re-normaliza carbo para fechar kcal exatamente
  const kcal = alvo;
  const p = pG;
  const f = fG;
  const kcalFixed = (p * 4) + (f * 9);
  const c = Math.max(0, (kcal - kcalFixed) / 4);

  // fibras
  const fib = fiberTargetG(kcal);

  // notas biotipo (explicação pro usuário)
  if (opts.biotipo === "ectomorfo") notas.push("Heurística ectomorfo: leve prioridade a carbo/densidade calórica.");
  if (opts.biotipo === "mesomorfo") notas.push("Heurística mesomorfo: distribuição equilibrada de macros.");
  if (opts.biotipo === "endomorfo") notas.push("Heurística endomorfo: leve ajuste de carbo + foco em saciedade/fibras.");

  return {
    ree_kcal: round(ree),
    tdee_kcal: round(tdee),
    alvo_kcal: round(kcal),
    metodo_ree: metodo,
    fator_atividade: fator,
    delta_objetivo_kcal: round(delta),
    macros: {
      kcal: round(kcal),
      proteina_g: round(p),
      carbo_g: round(c),
      gordura_g: round(f),
      fibras_g: round(fib),
    },
    notas,
  };
}


// MF_NUTRITION_ENGINE_AUDITED_V1
export type NutritionEngineAudit = ReturnType<typeof mfAudit>;

export type NutritionEngineOutputAudited<T extends Record<string, unknown> = Record<string, unknown>> =
  T & { audit: NutritionEngineAudit };

/**
 * Wrapper SSOT: executa o motor existente e anexa audit.trace + audit.warnings.
 * Não quebra consumidores antigos: use quando precisar rastreabilidade.
 */
export function runNutritionEngineAudited(input: any): NutritionEngineOutputAudited<any> {
  // chama função existente (tentaremos detectar o nome padrão)
  const trace: Record<string, unknown> = {
    input,
    engine: "nutritionEngine",
  };

  // best-effort: descobrir função principal exportada
  const fnName =
    (typeof (exports as any).runNutritionEngine === "function" && "runNutritionEngine") ||
    (typeof (exports as any).nutritionEngine === "function" && "nutritionEngine") ||
    (typeof (exports as any).computeNutritionPlan === "function" && "computeNutritionPlan") ||
    null;

  const baseOut = fnName ? (exports as any)[fnName](input) : null;
  if (!baseOut) {
    const warn: MFWarn = {
      code: "NUT_ENGINE_NOT_FOUND",
      message: "Função principal do nutritionEngine não detectada para wrapper auditável.",
      severity: "warn",
    };
    return { audit: mfAudit(trace, [warn]) } as any;
  }

  // Guardrails: se houver tdee/alvo no output, aplica rails e registra warning/trace
  const tdee = Number((baseOut as any)?.tdee_kcal ?? (baseOut as any)?.tdee ?? 0) || 0;
  const alvo = Number((baseOut as any)?.alvo_kcal ?? (baseOut as any)?.alvo ?? (baseOut as any)?.kcal ?? 0) || 0;

  const warnings: MFWarn[] = [];

  try {
    if (tdee > 0 && alvo > 0) {
      const gr = applyNutritionGuardrails({
        tdeeKcal: tdee,
        goalKcal: alvo,
        sex: input?.sex ?? input?.sexo,
        age: input?.age ?? input?.idade,
        weightKg: input?.weightKg ?? input?.peso,
        heightCm: input?.heightCm ?? input?.altura,
      });
      trace["guardrails"] = gr.trace;
      for (const w of gr.warnings) {
        warnings.push({ code: w.code, message: w.message, severity: w.code.includes("AGGRESSIVE") ? "danger" : "warn" });
      }
      // se guardrails ajustarem, refletir no output sem quebrar macros (apenas alvo)
      if (gr.kcalTarget && gr.kcalTarget !== alvo) {
        (baseOut as any).alvo_kcal = gr.kcalTarget;
        (baseOut as any).alvo = gr.kcalTarget;
      }
    } else {
      warnings.push({ code: "NUT_GUARDRAILS_SKIPPED", message: "Guardrails não aplicados (tdee/alvo ausentes).", severity: "info" });
    }
  } catch {
    warnings.push({ code: "NUT_GUARDRAILS_ERROR", message: "Falha ao aplicar guardrails (fail-safe).", severity: "warn" });
  }

  trace["outputKeys"] = Object.keys(baseOut || {});

  return {
    ...(baseOut as any),
    audit: mfAudit(trace, warnings),
  };
}

