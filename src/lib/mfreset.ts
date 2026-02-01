/**
 * MFRESET_CANONICAL_V1
 * Reset canônico de localStorage/sessionStorage para DrMindSetFitApp.
 *
 * - soft: limpa funil (onboarding/plano/assinatura) preservando histórico/tema
 * - hard: limpa tudo do app (inclui histórico/relatórios/etc)
 *
 * Observação: usamos allowlist no soft para preservar theme e itens “neutros”.
 */

type ResetMode = "soft" | "hard";

const SOFT_KEYS_EXACT = new Set<string>([
  // Core state
  "drmindsetfit_state",
  "drmindsetfit.profile.v1",
  "drmindsetfit:flags",

  // Onboarding flow
  "mindsetfit:onboardingProgress:v1",
  "mf:onboarding:draft:v1",
  "mf:onboarding:done:v1",

  // Plan bridge
  "mf:activePlan:v1",

  // Strength module
  "mf_strength_selected_groups",
  "mf_strength_week_plan",

  // HIIT module
  "drmindsetfit.hiit.v3",

  // Subscription quick flags (pages/Assinatura.tsx)
  "mindsetfit:isSubscribed",
  "mindsetfit:subscription:v1",
]);

// No soft, preserva theme e histórico/relatórios.
// (hard vai limpar também)
const SOFT_ALLOWLIST_PREDICATES: Array<(k: string) => boolean> = [
  // tema (theme-provider costuma usar storageKey tipo "vite-ui-theme" / "theme" etc)
  (k) => /theme/i.test(k),
  // se você quiser preservar preferências de UI no soft (adicione aqui futuramente)
];

// Prefixos do app (hard limpa tudo que bater)
const HARD_PREFIXES = [
  "mf:",
  "mindsetfit:",
  "drmindsetfit",
  "mf_",
];

// Alguns módulos guardam keys genéricas (ex: "history" em fitness-suite)
const HARD_KEYS_EXTRA = new Set<string>([
  "history",
]);

function safeKeys(storage: Storage): string[] {
  try {
    const keys: string[] = [];
    for (let i = 0; i < storage.length; i++) {
      const k = storage.key(i);
      if (k) keys.push(k);
    }
    return keys;
  } catch {
    return [];
  }
}

function shouldPreserveSoft(key: string): boolean {
  return SOFT_ALLOWLIST_PREDICATES.some((fn) => {
    try { return fn(key); } catch { return false; }
  });
}

function removeKeys(storage: Storage, keys: string[]): { removed: string[] } {
  const removed: string[] = [];
  for (const k of keys) {
    try {
      storage.removeItem(k);
      removed.push(k);
    } catch {
      // noop
    }
  }
  return { removed };
}

export function mfReset(mode: ResetMode): { mode: ResetMode; removed: string[] } {
  const removedAll: string[] = [];

  const storages: Storage[] = [];
  try { storages.push(window.localStorage); } catch {}
  try { storages.push(window.sessionStorage); } catch {}

  for (const st of storages) {
    const keys = safeKeys(st);

    if (mode === "soft") {
      const toRemove: string[] = [];
      for (const k of keys) {
        if (shouldPreserveSoft(k)) continue;

        // remove exatos canônicos
        if (SOFT_KEYS_EXACT.has(k)) { toRemove.push(k); continue; }

        // soft remove também por prefixos que claramente pertencem ao funil
        // (mantendo histórico/relatórios se estiverem em mindsetfit:report... etc)
        // => regra: se for onboarding/activePlan/subscription/strength/hiit
        if (
          k.startsWith("mf:onboarding:") ||
          k.startsWith("mindsetfit:onboarding") ||
          k.startsWith("mf:activePlan") ||
          k.startsWith("mindsetfit:subscription") ||
          k.startsWith("mindsetfit:isSubscribed") ||
          k.startsWith("mf_strength_") ||
          k.startsWith("drmindsetfit.hiit")
        ) {
          toRemove.push(k);
          continue;
        }
      }

      removedAll.push(...removeKeys(st, Array.from(new Set(toRemove))).removed);
    } else {
      // hard
      const toRemove: string[] = [];
      for (const k of keys) {
        if (HARD_KEYS_EXTRA.has(k)) { toRemove.push(k); continue; }
        if (HARD_PREFIXES.some((p) => k.startsWith(p))) { toRemove.push(k); continue; }
      }
      removedAll.push(...removeKeys(st, Array.from(new Set(toRemove))).removed);
    }
  }

  return { mode, removed: removedAll };
}

/**
 * Lê ?reset=soft|hard e executa reset.
 * Retorna true se resetou algo.
 */
export function mfResetFromQuery(): boolean {
  try {
    const sp = new URLSearchParams(window.location.search);
    const mode = sp.get("reset");
    if (mode !== "soft" && mode !== "hard") return false;

    const res = mfReset(mode);
    // limpa o query param da URL para não ficar resetando em loop em refresh
    try {
      sp.delete("reset");
      const next = window.location.pathname + (sp.toString() ? `?${sp.toString()}` : "") + window.location.hash;
      window.history.replaceState({}, "", next);
    } catch { /* noop */ }

    // log leve (não quebra UX)
    try { console.log("[mfreset]", res.mode, "removed:", res.removed.length); } catch {}
    return res.removed.length > 0;
  } catch {
    return false;
  }
}
