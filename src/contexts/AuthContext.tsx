import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

// __MF_DEMO_ONBOARDING_GUARD__
// Regra: em /onboarding, DEMO não pode rodar efeitos que redirecionam/ativam premium/logam repetidamente.
const __mfIsOnboardingRoute = (): boolean => {
  try {
    if (typeof window === "undefined") return false;
    const p = window.location?.pathname || "";
    return p.startsWith("/onboarding");
  } catch {
    return false;
  }
};


// MF_DEMO_ONCE_GUARD (StrictMode-safe)
// Evita loops de DEMO que disparam setState/store em re-render/hidratação.
const __mfOncePerSession = (key: string) => {
  try {
    const k = "mf_once__" + key;
    if (typeof sessionStorage !== "undefined") {
      if (sessionStorage.getItem(k) === "1") return false;
      sessionStorage.setItem(k, "1");
      return true;
    }
  } catch {}
  (globalThis as any).__mf_once = (globalThis as any).__mf_once || {};
  if ((globalThis as any).__mf_once[key]) return false;
  (globalThis as any).__mf_once[key] = true;
  return true;
};


interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: AuthError | null }>
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)
// DEV_PASS_AUTH: ?dev=1 força usuário logado para testes locais
const __isDevPass = (() => { try { return new URLSearchParams(window.location.search).get("dev") === "1"; } catch { return false; } })();

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(__isDevPass ? false : true)

  useEffect(() => {
    if ((globalThis as any).__mf_demo_guard__auth) return;
    (globalThis as any).__mf_demo_guard__auth = true;

    if (__mfIsOnboardingRoute()) { return; }

    if (!__mfOncePerSession("demo_autologin")) return;

    // Modo DEMO: criar usuário fake automaticamente
    if (!isSupabaseConfigured) {
      const demoUser: User = {
        id: 'demo-user-123',
        email: 'demo@drmindsetfit.com',
        aud: 'authenticated',
        role: 'authenticated',
        created_at: new Date().toISOString(),
        app_metadata: {},
        user_metadata: { full_name: 'Usuário Demo' }
      } as User

      const demoSession: Session = {
        access_token: 'demo-token',
        refresh_token: 'demo-refresh',
        expires_in: 3600,
        token_type: 'bearer',
        user: demoUser
      } as Session

      setUser(demoUser)
      setSession(demoSession)
      setLoading(false)
      if (import.meta.env.DEV) console.log('🎭 Modo DEMO ativado - Login automático')
      return
    }

    // Modo REAL: usar Supabase
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Escutar mudanças de autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string, fullName: string) => {
    // Modo DEMO: simular cadastro bem-sucedido
    if (!isSupabaseConfigured) {
      if (import.meta.env.DEV) console.log('🎭 Modo DEMO: Cadastro simulado para', email)
      return { error: null }
    }

    // Modo REAL: usar Supabase
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })

      if (error) return { error }

      // Criar perfil inicial
      if (data.user) {
        await supabase.from('profiles').insert({
          user_id: data.user.id,
          nome_completo: fullName,
          data: {},
        })
      }

      return { error: null }
    } catch (error) {
      return { error: error as AuthError }
    }
  }

  const signIn = async (email: string, password: string) => {
    // Modo DEMO: simular login bem-sucedido
    if (!isSupabaseConfigured) {
      if (import.meta.env.DEV) console.log('🎭 Modo DEMO: Login simulado para', email)
      return { error: null }
    }

    // Modo REAL: usar Supabase
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      return { error }
    } catch (error) {
      return { error: error as AuthError }
    }
  }

  const signOut = async () => {
    // Modo DEMO: apenas limpar estado local
    if (!isSupabaseConfigured) {
      setUser(null)
      setSession(null)
      if (import.meta.env.DEV) console.log('🎭 Modo DEMO: Logout simulado')
      return
    }

    // Modo REAL: usar Supabase
    await supabase.auth.signOut()
  }

  const resetPassword = async (email: string) => {
    // Modo DEMO: simular reset de senha
    if (!isSupabaseConfigured) {
      if (import.meta.env.DEV) console.log('🎭 Modo DEMO: Reset de senha simulado para', email)
      return { error: null }
    }

    // Modo REAL: usar Supabase
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      return { error }
    } catch (error) {
      return { error: error as AuthError }
    }
  }

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider')
  }
  return context
}
