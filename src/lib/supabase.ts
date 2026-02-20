// src/lib/supabase.ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// flag pra saber se o Supabase está configurado de verdade
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

let supabaseClient: SupabaseClient;

if (!isSupabaseConfigured) {
  console.warn(
    "⚠️ Rodando em modo DEMO - Supabase não configurado. Os dados não serão persistidos."
  );
  // Se chegar aqui é porque as envs não foram lidas.
  // Em vez de usar client fake silencioso, vamos explodir cedo:
  throw new Error(
    "Supabase não configurado. Verifique VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env.local"
  );
} else {
  supabaseClient = createClient(supabaseUrl!, supabaseAnonKey!);
}

export const supabase = supabaseClient;