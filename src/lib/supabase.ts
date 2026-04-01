import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

const url = (import.meta as any).env?.VITE_SUPABASE_URL ?? "";
const anon = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ?? "";

/**
 * Safe fallback Supabase client:
 * - nao persiste dados
 * - evita crash em ambientes sem env configurada
 * - retorna sessao nula e metodos no-op para bootstrap seguro
 * OBS: tipamos como SupabaseClient via cast para manter compatibilidade do projeto.
 */
function createSafeFallbackSupabase(): SupabaseClient {
  const noop = async () => ({ data: null as any, error: null as any });

  const auth = {
    getSession: async () => ({ data: { session: null }, error: null }),
    getUser: async () => ({ data: { user: null }, error: null }),
    onAuthStateChange: (_cb: any) => ({ data: { subscription: { unsubscribe() {} } } }),
    signInWithPassword: async () => ({ data: { user: null, session: null }, error: null }),
    signInWithOtp: async () => ({ data: { user: null, session: null }, error: null }),
    signUp: async () => ({ data: { user: null, session: null }, error: null }),
    signOut: async () => ({ error: null }),
  };

  const handler: ProxyHandler<any> = {
    get(_target, prop) {
      if (prop === "auth") return auth;
      if (prop === "__isFallbackClient") return true;
      return (..._args: any[]) => noop();
    },
  };

  return new Proxy({}, handler) as unknown as SupabaseClient;
}

export const isSupabaseConfigured = Boolean(url && anon);

export const supabase: SupabaseClient = isSupabaseConfigured
  ? createClient(url, anon, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : createSafeFallbackSupabase();

if (!isSupabaseConfigured) {
  console.warn(
    "[MF] Supabase nao configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY para habilitar autenticacao e persistencia.",
  );
}
