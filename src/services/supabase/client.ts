import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!url || !anon) {
  console.warn("[MF_SUPABASE] Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY");
}

export const supabase = createClient(
  url ?? "http://localhost/mf-missing-supabase-url",
  anon ?? "mf-missing-supabase-anon",
  { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }
);

// MF_SUPABASE_IS_CONFIGURED_V1
// SSOT helper to avoid multiple GoTrueClient instances warnings.
// True when the required env vars are present (Vite: import.meta.env.*).
export const isSupabaseConfigured: boolean = Boolean(
  (import.meta as any)?.env?.VITE_SUPABASE_URL && (import.meta as any)?.env?.VITE_SUPABASE_ANON_KEY
);

