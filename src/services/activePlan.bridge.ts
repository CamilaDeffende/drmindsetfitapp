export const ACTIVE_PLAN_KEY = "mindsetfit_active_plan_v1" as const;

const LEGACY_KEYS = [
  "mindsetfit_activePlanV1",
  "activePlanV1",
  "planV1",
  "planoAtivo",
] as const;

export function readActivePlanRaw(): string | null {
  try {
    const primary = localStorage.getItem(ACTIVE_PLAN_KEY);
    if (primary) return primary;

    for (const k of LEGACY_KEYS) {
      const v = localStorage.getItem(k);
      if (v) return v;
    }
    return null;
  } catch {
    return null;
  }
}

export function writeActivePlanRaw(json: string): void {
  try {
    localStorage.setItem(ACTIVE_PLAN_KEY, json);
    // opcional: manter legado em sync (não obrigatório)
  } catch {}
}

export function hasActivePlan(): boolean {
  return !!readActivePlanRaw();
}
