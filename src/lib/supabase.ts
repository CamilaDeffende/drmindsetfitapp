import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Verificar se o Supabase está configurado
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey && supabaseUrl !== 'your_supabase_project_url')

if (!isSupabaseConfigured) {
  console.warn('⚠️ Rodando em modo DEMO - Supabase não configurado. Os dados não serão persistidos.')
}

// Criar cliente com valores dummy se não configurado (evita erros)
export const supabase = createClient(
  supabaseUrl || 'https://demo.supabase.co',
  supabaseAnonKey || 'demo-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
)

// Database Types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          created_at: string
          updated_at: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          stripe_customer_id: string
          stripe_subscription_id: string
          status: 'active' | 'canceled' | 'past_due' | 'trialing'
          plan: 'free' | 'premium'
          current_period_start: string
          current_period_end: string
          cancel_at_period_end: boolean
          created_at: string
          updated_at: string
        }
      }
      profiles: {
        Row: {
          id: string
          user_id: string
          nome_completo: string
          data: any
          created_at: string
          updated_at: string
        }
      }
      treinos: {
        Row: {
          id: string
          user_id: string
          data: string
          dados: any
          created_at: string
        }
      }
      nutricoes: {
        Row: {
          id: string
          user_id: string
          data: string
          dados: any
          created_at: string
        }
      }
      corridas: {
        Row: {
          id: string
          user_id: string
          data: string
          dados: any
          created_at: string
        }
      }
    }
  }
}
