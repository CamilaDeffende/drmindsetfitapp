import {
  SUBSCRIPTION_KEY,
  SUBSCRIPTION_MODE_KEY,
  REPORT_HISTORY_BASE_KEY,
  CURRENT_PATIENT_KEY,
  PATIENTS_KEY,
  PDF_VARIANT_KEY,
} from "@/lib/storageKeys";
import { mfResetFromQuery } from "./mfreset";

/**
 * Reset Premium do app via URL:
 *   /?reset=soft  -> limpa funil (assinatura/onboarding/state)
 *   /?reset=hard  -> limpa tudo do app (mantém tema)
 *
 * Mantém:
 *   - ui-theme (preferência visual)
 */
type ResetMode = "soft" | "hard";

const THEME_KEY = "ui-theme";

// Core do funil (já mapeado no scan)
const CORE_KEYS = [
  "drmindsetfit_state",
  "mindsetfit:isSubscribed",
  "mindsetfit:onboardingCompleted",

  // compat/legado checado no RouteGuard
  "mindsetfit_state",
  "mindsetfit:state",
  "state",
];

// Stores extras conhecidos
const EXTRA_KEYS = [
  "history", // useHistoryStore
  "mindsetfit:currentPatient:v1",
  "drmindsetfit.hiit.v3",
];

function safeRemove(key: string) {
  try { localStorage.removeItem(key); } catch { /* noop */ }
}

function safeGetKeys(): string[] {
  try { return Object.keys(localStorage); } catch { return []; }
}

/**
 * HARD: remove qualquer chave relacionada ao app por prefixo, mas preserva tema.
 * - remove drmindsetfit*
 * - remove mindsetfit*
 * - remove cardio*
 * - remove history (store)
 */
function hardReset() {
  const keys = safeGetKeys();

  for (const k of keys) {
    if (k === THEME_KEY) continue;

    const isAppKey =
      k.startsWith("drmindsetfit") ||
      k.startsWith("mindsetfit") ||
      k.startsWith("cardio") ||
      k === "history" ||
      k === "state" ||
      k === "mindsetfit_state";

    if (isAppKey) safeRemove(k);
  }

  // remove também constantes específicas (caso usem nomes fora do prefixo)
  safeRemove(SUBSCRIPTION_KEY);
  safeRemove(SUBSCRIPTION_MODE_KEY);
  safeRemove(REPORT_HISTORY_BASE_KEY);
  safeRemove(CURRENT_PATIENT_KEY);
  safeRemove(PATIENTS_KEY);
  safeRemove(PDF_VARIANT_KEY);

  // extras conhecidos
  for (const k of EXTRA_KEYS) safeRemove(k);
}

/**
 * SOFT: limpa apenas o que atrapalha testar o funil do zero,
 * preservando histórico e preferências (exceto assinatura/onboarding/state).
 */
function softReset() {
  for (const k of CORE_KEYS) safeRemove(k);

  // assinatura/mode
  safeRemove(SUBSCRIPTION_KEY);
  safeRemove(SUBSCRIPTION_MODE_KEY);

  // não mexe em theme (ui-theme) e não mexe em history/pacientes por padrão
}

export function resetAppStorage(mode: ResetMode) {
  
  // MFRESET_CANONICAL_V1: aplica reset por query (?reset=soft|hard) antes de qualquer redirect
  try {
    const did = mfResetFromQuery();
    if (did) {
      // mantém comportamento existente (redirects/return) definido no arquivo original
    }
  } catch { /* noop */ }
if (mode === "hard") hardReset();
  else softReset();
}

/**
 * Executa reset se detectar query param "reset".
 * Retorna true se resetou (e fez redirect).
 */
export function maybeResetFromUrl(): boolean {
  if (typeof window === "undefined") return false;

  const url = new URL(window.location.href);
  const reset = (url.searchParams.get("reset") || "").toLowerCase();

  if (reset !== "soft" && reset !== "hard") return false;

  resetAppStorage(reset as ResetMode);

  // remove o param da URL e volta para /login (fluxo limpo)
  window.location.replace("/onboarding/step-1");
  return true;
}
