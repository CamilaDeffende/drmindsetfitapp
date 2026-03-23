import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, Session, AuthError } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

const ACTIVE_PLAN_KEY = "mf:activePlan:v1";
const ONBOARDING_DONE_KEY = "mf:onboarding:done:v1";
const ONBOARDING_DRAFT_KEY = "mf:onboarding:draft:v1";
const PENDING_IMPORT_KEY = "mf:pendingProfileImport:v1";

function readJsonStorage<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJsonStorage(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

function clearLocalAppState() {
  try {
    localStorage.removeItem(ACTIVE_PLAN_KEY);
    localStorage.removeItem(ONBOARDING_DRAFT_KEY);
    localStorage.removeItem(ONBOARDING_DONE_KEY);
  } catch {}
}

function shouldImportPendingGuestState() {
  try {
    return localStorage.getItem(PENDING_IMPORT_KEY) === "1";
  } catch {
    return false;
  }
}

function clearPendingGuestStateImport() {
  try {
    localStorage.removeItem(PENDING_IMPORT_KEY);
  } catch {}
}

function buildProfileAppData() {
  const activePlan = readJsonStorage<any>(ACTIVE_PLAN_KEY);
  const onboardingDraft = readJsonStorage<any>(ONBOARDING_DRAFT_KEY);

  let onboardingDone = false;
  try {
    onboardingDone = localStorage.getItem(ONBOARDING_DONE_KEY) === "1";
  } catch {}

  return {
    onboardingDone: onboardingDone || Boolean(activePlan),
    activePlan,
    onboardingDraft,
    updatedAtISO: new Date().toISOString(),
  };
}

async function syncLocalAppStateToProfile(userId: string, fullName?: string) {
  if (!isSupabaseConfigured || !userId) return;

  const payload = buildProfileAppData();
  const hasMeaningfulData =
    payload.onboardingDone || payload.activePlan || payload.onboardingDraft;

  if (!hasMeaningfulData) return;

  try {
    await supabase.from("profiles").upsert(
      {
        user_id: userId,
        ...(fullName ? { nome_completo: fullName } : {}),
        data: payload,
      },
      { onConflict: "user_id" }
    );
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn("[MF] Não foi possível sincronizar onboarding/plano no profile.", error);
    }
  }
}

async function hydrateLocalAppStateFromProfile(userId: string) {
  if (!isSupabaseConfigured || !userId) return;

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("data")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      if (import.meta.env.DEV) {
        console.warn("[MF] Falha ao carregar dados do profile.", error);
      }
      return;
    }

    const appData = data?.data ?? {};
    const activePlan = appData?.activePlan ?? null;
    const onboardingDraft = appData?.onboardingDraft ?? null;
    const onboardingDone = Boolean(appData?.onboardingDone || activePlan);

    clearLocalAppState();

    if (activePlan) writeJsonStorage(ACTIVE_PLAN_KEY, activePlan);
    if (onboardingDraft) writeJsonStorage(ONBOARDING_DRAFT_KEY, onboardingDraft);
    if (onboardingDone) {
      try {
        localStorage.setItem(ONBOARDING_DONE_KEY, "1");
      } catch {}
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn("[MF] Exceção ao hidratar onboarding/plano do profile.", error);
    }
  }
}

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
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// DEV_PASS_AUTH: ?dev=1 força usuário logado para testes locais
const __isDevPass = (() => {
  try {
    return new URLSearchParams(window.location.search).get("dev") === "1";
  } catch {
    return false;
  }
})();

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(__isDevPass ? false : true);

  useEffect(() => {
    // IMPORTANTE:
    // Não bloquear bootstrap de auth em /onboarding.
    // O funil (onboarding obrigatório antes do login) deve ser controlado por RouteGuard/rotas,
    // não travando o AuthProvider — isso causava "loading infinito" no dashboard.

    if ((globalThis as any).__mf_demo_guard__auth) return;
    (globalThis as any).__mf_demo_guard__auth = true;

    // Em DEV/StrictMode, evita rodar bloco DEMO mais de uma vez
    if (!__mfOncePerSession("demo_autologin")) {
      // Mesmo se pular o bloco DEMO, no modo REAL ainda precisamos garantir getSession/onAuthStateChange.
      // Então não retornamos aqui.
    }

    // Modo DEMO: criar usuário fake automaticamente (somente quando Supabase não está configurado)
    if (!isSupabaseConfigured) {
      const demoUser: User = {
        id: "demo-user-123",
        email: "demo@drmindsetfit.com",
        aud: "authenticated",
        role: "authenticated",
        created_at: new Date().toISOString(),
        app_metadata: {},
        user_metadata: { full_name: "Usuário Demo" },
      } as User;

      const demoSession: Session = {
        access_token: "demo-token",
        refresh_token: "demo-refresh",
        expires_in: 3600,
        token_type: "bearer",
        user: demoUser,
      } as Session;

      setUser(demoUser);
      setSession(demoSession);
      setLoading(false);
      if (import.meta.env.DEV) console.log("🎭 Modo DEMO ativado - Login automático");
      return;
    }

    // Modo REAL: usar Supabase
    supabase.auth
      .getSession()
      .then(async ({ data: { session } }) => {
        if (session?.user?.id) {
          await hydrateLocalAppStateFromProfile(session.user.id);
        }
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      })
      .catch(() => {
        // Em caso de falha de rede/config, não travar o app em loading infinito
        setSession(null);
        setUser(null);
        setLoading(false);
      });

    // Escutar mudanças de autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      void (async () => {
        if (event === "SIGNED_OUT") {
          clearPendingGuestStateImport();
          clearLocalAppState();
        }
        if (session?.user?.id) {
          await hydrateLocalAppStateFromProfile(session.user.id);
        }
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  // CORRIGIDO: agora é idempotente (upsert) e alinhado ao schema (UNIQUE(user_id))
  const signUp = async (email: string, password: string, fullName: string) => {
    // Modo DEMO: simular cadastro bem-sucedido
    if (!isSupabaseConfigured) {
      if (import.meta.env.DEV) console.log("🎭 Modo DEMO: Cadastro simulado para", email);
      return { error: null };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      });

      if (error) return { error };

      // Criar/atualizar perfil inicial (não falhar o signup se o upsert do perfil falhar)
      if (data.user) {
        try {
          const { error: profileError } = await supabase
            .from("profiles")
            .upsert(
              {
                user_id: data.user.id,
                nome_completo: fullName,
                data: {},
              },
              { onConflict: "user_id" }
            );

          if (profileError) {
            if (import.meta.env.DEV) console.warn("⚠️ Falha ao upsert do profile, seguindo mesmo assim.", profileError);
          }
        } catch (e) {
          if (import.meta.env.DEV) console.warn("⚠️ Exceção ao upsert do profile, seguindo mesmo assim.", e);
        }

        if (shouldImportPendingGuestState()) {
          await syncLocalAppStateToProfile(data.user.id, fullName);
        }
        clearPendingGuestStateImport();
        await hydrateLocalAppStateFromProfile(data.user.id);
      }

      return { error: null };
    } catch (error) {
      return { error: error as AuthError };
    }
  };

  const signIn = async (email: string, password: string) => {
    // Modo DEMO: simular login bem-sucedido
    if (!isSupabaseConfigured) {
      if (import.meta.env.DEV) console.log("🎭 Modo DEMO: Login simulado para", email);
      return { error: null };
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (!error) {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user?.id) {
          if (shouldImportPendingGuestState()) {
            await syncLocalAppStateToProfile(user.id, user.user_metadata?.full_name);
          }
          clearPendingGuestStateImport();
          await hydrateLocalAppStateFromProfile(user.id);
        }
      }
      return { error };
    } catch (error) {
      return { error: error as AuthError };
    }
  };

  const signOut = async () => {
    // Modo DEMO: apenas limpar estado local
    if (!isSupabaseConfigured) {
      clearPendingGuestStateImport();
      clearLocalAppState();
      setUser(null);
      setSession(null);
      if (import.meta.env.DEV) console.log("🎭 Modo DEMO: Logout simulado");
      return;
    }

    await supabase.auth.signOut();
  };

  const resetPassword = async (email: string) => {
    // Modo DEMO: simular reset de senha
    if (!isSupabaseConfigured) {
      if (import.meta.env.DEV) console.log("🎭 Modo DEMO: Reset de senha simulado para", email);
      return { error: null };
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      return { error };
    } catch (error) {
      return { error: error as AuthError };
    }
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider");
  }
  return context;
}
