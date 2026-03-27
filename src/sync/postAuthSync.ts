import { supabase, isSupabaseConfigured } from "@/lib/supabase";

const DONE_KEY = "mf:onboarding:done:v1";
const DRAFT_KEY = "mf:onboarding:draft:v1";
const ACTIVE_PLAN_KEY = "mf:activePlan:v1";

const SESSION_GUARD_PREFIX = "mf:postauthsynced:";
const COOLDOWN_PREFIX = "mf:postauthsync:cooldown:";
const DEFAULT_COOLDOWN_MS = 60_000;

type Json = Record<string, unknown> | unknown[] | string | number | boolean | null;

function safeGetLS(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}
function safeRemoveLS(key: string) {
  try { localStorage.removeItem(key); } catch {}
}
function safeGetSS(key: string): string | null {
  try { return sessionStorage.getItem(key); } catch { return null; }
}
function safeSetSS(key: string, value: string) {
  try { sessionStorage.setItem(key, value); } catch {}
}
function safeJsonParse(raw: string | null): Json {
  if (!raw) return null;
  try { return JSON.parse(raw) as Json; } catch { return null; }
}

function isDone(): boolean {
  return safeGetLS(DONE_KEY) === "1";
}

function deriveNomeCompletoFromDraft(draft: any): string | null {
  try {
    const nome = String(draft?.step1?.nomeCompleto || "").trim();
    return nome.length >= 3 ? nome : null;
  } catch {
    return null;
  }
}

function buildProfileDataPayload(draft: Json, activePlan: Json) {
  return {
    onboardingDone: true,
    activePlan: activePlan ?? null,
    onboardingDraft: draft ?? null,
    updatedAtISO: new Date().toISOString(),
  };
}

function isInCooldown(userId: string): boolean {
  const raw = safeGetSS(COOLDOWN_PREFIX + userId);
  const until = raw ? Number(raw) : NaN;
  return Number.isFinite(until) ? Date.now() < until : false;
}

function setCooldown(userId: string, ms = DEFAULT_COOLDOWN_MS) {
  safeSetSS(COOLDOWN_PREFIX + userId, String(Date.now() + ms));
}

const inFlight = new Map<string, Promise<void>>();

export async function postAuthSync(userId: string): Promise<void> {
  if (!userId) return;
  if (!isSupabaseConfigured) return;

  const guardKey = SESSION_GUARD_PREFIX + userId;
  if (safeGetSS(guardKey) === "1") return;

  if (!isDone()) return;
  if (isInCooldown(userId)) return;

  const existing = inFlight.get(userId);
  if (existing) return existing;

  const p = (async () => {
    try {
      const draft = safeJsonParse(safeGetLS(DRAFT_KEY));
      const activePlan = safeJsonParse(safeGetLS(ACTIVE_PLAN_KEY));

      if (!draft && !activePlan) {
        safeSetSS(guardKey, "1");
        return;
      }

      const nomeCompleto = deriveNomeCompletoFromDraft(draft);
      const nomeParaSalvar = nomeCompleto || "Usuario";
      const profileData = buildProfileDataPayload(draft, activePlan);

      const { error } = await supabase
        .from("profiles")
        .upsert(
          {
            user_id: userId,
            nome_completo: nomeParaSalvar,
            data: profileData,
          },
          { onConflict: "user_id" }
        );

      if (error) throw error;

      safeSetSS(guardKey, "1");
      safeRemoveLS(DRAFT_KEY);
      if (import.meta.env.DEV) console.log("[PostAuthSync] Sync OK");
    } catch (err) {
      console.warn("[PostAuthSync] Sync falhou:", err);
      setCooldown(userId);
    } finally {
      inFlight.delete(userId);
    }
  })();

  inFlight.set(userId, p);
  return p;
}
