import { useState, useEffect } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

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


export interface Subscription {
  id: string
  user_id: string
  stripe_customer_id: string
  stripe_subscription_id: string
  status: 'active' | 'canceled' | 'past_due' | 'trialing'
  plan: 'free' | 'premium'
  current_period_start: string
  current_period_end: string
  cancel_at_period_end: boolean
}

export function useSubscription() {
  // DEV_PASS_SUBSCRIPTION: ?dev=1 força premium para testes locais (sem quebrar hooks)
  const __devPass = (() => { try { return new URLSearchParams(window.location.search).get("dev") === "1"; } catch { return false; } })();

  
  void __devPass;
  const { user } = useAuth()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [isActive, setIsActive] = useState(false)
  const [isPremium, setIsPremium] = useState(false)

  useEffect(() => {
    if ((globalThis as any).__mf_demo_guard__sub) return;
    (globalThis as any).__mf_demo_guard__sub = true;

    if (__mfIsOnboardingRoute()) { return; }

    if (!__mfOncePerSession("demo_premium")) return;

    if (!user) {
      setSubscription(null)
      setIsActive(false)
      setIsPremium(false)
      setLoading(false)
      return
    }

    loadSubscription()
  }, [user])

  const loadSubscription = async () => {
    if (!user) return

    // Modo DEMO: simular assinatura premium ativa
    if (!isSupabaseConfigured) {
      const demoSubscription: Subscription = {
        id: 'demo-sub-123',
        user_id: user.id,
        stripe_customer_id: 'demo-customer',
        stripe_subscription_id: 'demo-subscription',
        status: 'active',
        plan: 'premium',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        cancel_at_period_end: false
      }

      setSubscription(demoSubscription)
      setIsActive(true)
      setIsPremium(true)
      setLoading(false)
      if (import.meta.env.DEV) console.log('🎭 Modo DEMO: Assinatura Premium ativada')
      return
    }

    // Modo REAL: usar Supabase
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        if (import.meta.env.DEV) console.error('Erro ao carregar assinatura:', error)
        setLoading(false)
        return
      }

      setSubscription(data)

      if (data) {
        const active = data.status === 'active' || data.status === 'trialing'
        const premium = data.plan === 'premium' && active

        setIsActive(active)
        setIsPremium(premium)
      } else {
        // Usuário sem assinatura = plano free
        setIsActive(false)
        setIsPremium(false)
      }

      setLoading(false)
    } catch (error) {
      if (import.meta.env.DEV) console.error('Erro ao verificar assinatura:', error)
      setLoading(false)
    }
  }

  const checkAccess = (feature: 'dashboard' | 'treino' | 'dieta' | 'corrida' | 'relatorios' | 'edit') => {
    // Dashboard básico é sempre liberado
    if (feature === 'dashboard') return true

    // Todas as outras features exigem premium
    return isPremium
  }

  return {
    subscription,
    loading,
    isActive,
    isPremium,
    checkAccess,
    reload: loadSubscription,
  }
}
