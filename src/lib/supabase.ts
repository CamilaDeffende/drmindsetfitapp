import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

const url = (import.meta as any).env?.VITE_SUPABASE_URL ?? "";
const anon = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ?? "";

/**
 * DEMO Supabase (mock):
 * - Não persiste
 * - Não quebra o app
 * - Retorna sessão nula e métodos "no-op"
 * OBS: tipamos como SupabaseClient via cast para manter compatibilidade do projeto.
 */
function createDemoSupabase(): SupabaseClient {
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

  // Proxy para capturar usos inesperados (DB/storage/etc) sem quebrar import.
  const handler: ProxyHandler<any> = {
    get(_t, prop) {
      if (prop === "auth") return auth;
      if (prop === "__isDemo") return true;
      // retorna funções no-op para evitar crash acidental
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
  : createDemoSupabase();

// Log explícito (aparece no console, mas não quebra)
if (!isSupabaseConfigured) {
  console.warn(
    "[MF] Rodando em modo DEMO — Supabase não configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY em .env.local para ativar."
  );
}
