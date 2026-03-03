export type AnyObj = Record<string, any>;

export const MF_ONBOARDING_DRAFT_KEY_V1 = "mf:onboarding:draft:v1";

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try { return JSON.parse(raw) as T; } catch { return null; }
}
function safeStringify(v: any): string {
  try { return JSON.stringify(v); } catch { return "{}"; }
}

export function readOnboardingDraftStorage(): AnyObj | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(MF_ONBOARDING_DRAFT_KEY_V1);
    const parsed = safeParse<AnyObj>(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch { return null; }
}

export function writeOnboardingDraftStorage(next: AnyObj): void {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(MF_ONBOARDING_DRAFT_KEY_V1, safeStringify(next)); } catch {}
}

export function mergeDraft(base: AnyObj, partial: AnyObj): AnyObj {
  const b = (base && typeof base === "object") ? base : {};
  const p = (partial && typeof partial === "object") ? partial : {};
  return { ...b, ...p };
}

export function normalizeDraftKeys(draft: AnyObj): AnyObj {
  const d = (draft && typeof draft === "object") ? draft : {};
  const out: AnyObj = { ...d };

  if (out.step5 == null && out.step5Modalidades != null) out.step5 = out.step5Modalidades;
  if (out.step6 == null && out.step6DiasSemana != null) out.step6 = out.step6DiasSemana;
  if (out.step7 == null && out.step7Preferencias != null) out.step7 = out.step7Preferencias;

  return out;
}
