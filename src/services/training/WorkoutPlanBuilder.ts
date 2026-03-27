// MF_WORKOUT_PLAN_BUILDER_V2
// Protocolo semanal (Seg -> Dom) com multi-modalidades.
// - Usuário escolhe N modalidades
// - Define dias por modalidade
// - Define condicionamento por modalidade
// - Motor cria sessões semanais ordenadas e estáveis
// - Suporta múltiplas modalidades no mesmo dia (ex: sex musculação + cross)
// - Respeita banco de exercícios via getExerciseCatalog()
// DEMO-safe: nunca lança erro.

import { getExerciseCatalog, __MF_EXERCISE_SOURCE } from "./exerciseCatalog";

export type MF_Level = "iniciante" | "intermediario" | "avancado";

export type MF_Session = {
  day: string;       // seg/ter/qua/qui/sex/sab/dom
  modality: string;  // musculacao/corrida/bike/funcional/cross...
  level: MF_Level;
  exercises: any[];  // itens do banco (estrutura original)
  slot?: number;     // quando há múltiplas sessões no mesmo dia (0,1,2...)
};

export type MF_PlanPreview = {
  sessions: MF_Session[];
  meta: {
    modalities: string[];
    exerciseSource: string;
    weekOrder: string[];
  };
};

const WEEK: string[] = ["seg", "ter", "qua", "qui", "sex", "sab", "dom"];

function safeArr<T>(v: any): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

function uniqStable(list: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const x of list) {
    const k = String(x || "").trim();
    if (!k) continue;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(k);
  }
  return out;
}

// Tenta obter modalidades a partir de diferentes formatos possíveis do draft
function extractModalities(draft: any): string[] {
  // 1) formato preferido
  const direct = uniqStable(safeArr<string>(draft?.modalidadesSelecionadas));
  if (direct.length) return direct;

  // 1.1) formato do onboarding atual: step5.modalidades = ["musculacao", ...]
  const fromStep5 = uniqStable(
    safeArr<any>(draft?.step5?.modalidades).map((x) => String(x || "")).filter(Boolean)
  );
  if (fromStep5.length) return fromStep5;

  // 2) formato step5Modalidades.modalidades = [{key,...}]
  const m2 = uniqStable(
    safeArr<any>(draft?.step5Modalidades?.modalidades).map((x) => String(x?.key || x?.id || x?.value || "")).filter(Boolean)
  );
  if (m2.length) return m2;

  // 3) formato antigo: step5Modalidades.primary
  const p = String(draft?.step5Modalidades?.primary || "");
  if (p) return [p];

  // 4) formato onboarding atual com primary em step5
  const p2 = String(draft?.step5?.primary || "");
  if (p2) return [p2];

  return [];
}

// Normaliza níveis (aceita variações)
function normalizeLevel(v: any): MF_Level {
  const s = String(v || "").toLowerCase();
  if (s.includes("avan")) return "avancado";
  if (s.includes("inter")) return "intermediario";
  return "iniciante";
}

// Quantidade de exercícios por sessão conforme nível
function nFor(level: MF_Level): number {
  return level === "avancado" ? 20 : level === "intermediario" ? 15 : 12;
}

function pickExercisesForModality(all: any[], modality: string, n: number): any[] {
  const m = String(modality || "").toLowerCase();

  // best-effort: filtro textual para manter compatível com qualquer schema do banco
  const filtered = all.filter((e) => {
    try {
      const s = JSON.stringify(e ?? {}).toLowerCase();
      return s.includes(m);
    } catch {
      return false;
    }
  });

  const base = filtered.length ? filtered : all;
  return base.slice(0, Math.max(0, n));
}

// Extrai dias por modalidade suportando formatos possíveis
function extractDaysByModality(draft: any): Record<string, string[]> {
  // formato preferido: diasPorModalidade = { musculacao:["seg","qua"], corrida:["sab"]... }
  const direct = draft?.diasPorModalidade;
  if (direct && typeof direct === "object") return direct as any;

  const step5Direct = draft?.step5?.diasPorModalidade;
  if (step5Direct && typeof step5Direct === "object") return step5Direct as any;

  // fallback: step5Modalidades.daysByModality
  const alt = draft?.step5Modalidades?.diasPorModalidade || draft?.step5Modalidades?.daysByModality;
  if (alt && typeof alt === "object") return alt as any;

  return {};
}

// Extrai condicionamento por modalidade suportando formatos possíveis
function extractLevelByModality(draft: any): Record<string, MF_Level> {
  const direct = draft?.condicionamentoPorModalidade;
  if (direct && typeof direct === "object") {
    const out: Record<string, MF_Level> = {};
    for (const k of Object.keys(direct)) out[k] = normalizeLevel(direct[k]);
    return out;
  }

  const step5Direct = draft?.step5?.condicionamentoPorModalidade;
  if (step5Direct && typeof step5Direct === "object") {
    const out: Record<string, MF_Level> = {};
    for (const k of Object.keys(step5Direct)) out[k] = normalizeLevel(step5Direct[k]);
    return out;
  }

  const alt = draft?.step5Modalidades?.condicionamentoPorModalidade || draft?.step5Modalidades?.levelByModality;
  if (alt && typeof alt === "object") {
    const out: Record<string, MF_Level> = {};
    for (const k of Object.keys(alt)) out[k] = normalizeLevel(alt[k]);
    return out;
  }

  return {};
}

export function buildWorkoutPlanPreview(draft: any): MF_PlanPreview {
  try {
    const modalities = extractModalities(draft);
    const daysByMod = extractDaysByModality(draft);
    const levelByMod = extractLevelByModality(draft);

    // monta day->modalities (ordem estável baseada em modalities)
    const dayMap: Record<string, string[]> = {};
    for (const d of WEEK) dayMap[d] = [];

    for (const mod of modalities) {
      const daysRaw = safeArr<string>(daysByMod?.[mod]);
      const days = uniqStable(daysRaw.map((x) => String(x).toLowerCase()));
      for (const d of days) {
        if (!dayMap[d]) dayMap[d] = [];
        // mantém ordem estável por modalities
        if (!dayMap[d].includes(mod)) dayMap[d].push(mod);
      }
    }

    const all = getExerciseCatalog();
    const sessions: MF_Session[] = [];

    // protocolo semanal: seg -> dom
    for (const day of WEEK) {
      const modsToday = dayMap[day] || [];
      let slot = 0;
      for (const mod of modsToday) {
        const level = (levelByMod?.[mod] ?? "iniciante") as MF_Level;
        sessions.push({
          day,
          modality: mod,
          level,
          slot,
          exercises: pickExercisesForModality(all, mod, nFor(level)),
        });
        slot += 1;
      }
    }

    return {
      sessions,
      meta: { modalities, exerciseSource: __MF_EXERCISE_SOURCE, weekOrder: WEEK },
    };
  } catch {
    return { sessions: [], meta: { modalities: [], exerciseSource: __MF_EXERCISE_SOURCE, weekOrder: WEEK } };
  }
}
