/**
 * Active Plan Bridge — fonte única de verdade para localStorage.
 * Motivo: existiam 2 chaves concorrentes:
 * - plan.service.ts salva em "mf:activePlan:v1"
 * - dashboard premium lia "mindsetfit_active_plan_v1"
 *
 * Este bridge unifica e migra automaticamente (legado -> primary).
 */

export const ACTIVE_PLAN_KEY = "mf:activePlan:v1" as const;

export const ACTIVE_PLAN_LEGACY_KEYS = [
  "mindsetfit_active_plan_v1",
  "mindsetfit_activePlanV1",
  "activePlanV1",
  "planoAtivo",
] as const;

type AnyObj = Record<string, any>;

function lsGet(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}
function lsSet(key: string, value: string): void {
  try { localStorage.setItem(key, value); } catch {}
}
function lsRemove(key: string): void {
  try { localStorage.removeItem(key); } catch {}
}

function pickRaw(): { key: string; raw: string } | null {
  const primary = lsGet(ACTIVE_PLAN_KEY);
  if (primary && primary.trim()) return { key: ACTIVE_PLAN_KEY, raw: primary };

  for (const k of ACTIVE_PLAN_LEGACY_KEYS) {
    const v = lsGet(k);
    if (v && v.trim()) return { key: k, raw: v };
  }
  return null;
}

/** Lê JSON (com migração automática se vier de chave legada) */
export function readActivePlan<T = AnyObj>(): T | null {
  const hit = pickRaw();
  if (!hit) return null;

  try {
    const parsed = JSON.parse(hit.raw) as T;

    // Migração: se veio de chave legada, grava na primary
    if (hit.key !== ACTIVE_PLAN_KEY) {
      try { lsSet(ACTIVE_PLAN_KEY, hit.raw); } catch {}
    }

    return parsed;
  } catch {
    return null;
  }
}

/** Salva sempre na chave primary e espelha em 1 legado para compat (se algo antigo ainda ler) */
export function writeActivePlan(plan: AnyObj): void {
  try {
    const json = JSON.stringify(plan);
    lsSet(ACTIVE_PLAN_KEY, json);

    // espelho: mantém o legado mais usado do premium antigo
    lsSet("mindsetfit_active_plan_v1", json);
  } catch {}
}

/** Remove todas as chaves possíveis (primary + legados) */
export function clearActivePlan(): void {
  lsRemove(ACTIVE_PLAN_KEY);
  for (const k of ACTIVE_PLAN_LEGACY_KEYS) lsRemove(k);
}

/** Debug: retorna qual chave foi encontrada (se houver) */
export function debugActivePlanKeyHit(): string | null {
  const hit = pickRaw();
  return hit ? hit.key : null;
}

/**
 * Compat: alguns trechos do app chamam isso no boot/flow.
 * Função idempotente: tenta migrar do legado para SSOT (ACTIVE_PLAN_KEY).
 */
export function migrateLegacyToSSOT(): boolean {
  try {
    // readActivePlan já faz:
    // - pick da primary ou legados
    // - parse JSON
    // - se veio de legado, grava em ACTIVE_PLAN_KEY
    const plan = readActivePlan<any>();
    if (!plan) return false;

    // garante escrita (SSOT + espelho legado principal)
    try { writeActivePlan(plan as any); } catch {}
    return true;
  } catch {
    return false;
  }
}
