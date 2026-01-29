import { useAuth } from '@/contexts/AuthContext'
import { useSubscription } from '@/hooks/useSubscription'
import { loadFlags } from "@/lib/featureFlags"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Lock, Crown, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
interface ProtectedRouteProps {
  children: React.ReactNode
  requiresPremium?: boolean
}

export function ProtectedRoute({ children, requiresPremium = false }: ProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth()
  const { isPremium, loading: subLoading } = useSubscription()
  const navigate = useNavigate()

  // PAYWALL_RUNTIME_FLAG_V1: evita "if(false)" (lint) e mantém assinatura desligada por enquanto
  const paywallEnabled = (() => {
    try {
      // se tiver featureFlags, usa; senão, mantém OFF
      if (typeof loadFlags === "function") return !!loadFlags().paywallEnabled;
      return false;
    } catch { return false; }
  })();
  // Aguardar carregamento
  if (authLoading || subLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-black via-gray-900 to-black">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#1E6BFF] mx-auto mb-4" />
          <p className="text-gray-400">Carregando...</p>
        </div>
      </div>
    )
  }

  // Não autenticado - redirecionar para login
  if (!user) {
    return undefined
  }

  // Rota requer premium mas usuário não tem
  // NO_PAYWALL_SIGNATURE_V3
  // assinatura desabilitada por enquanto: só bloqueia premium se paywallEnabled=true no device
  
  // Rota requer premium mas usuário não tem (paywall OFF por padrão)
  if (requiresPremium && !isPremium && paywallEnabled) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-black via-gray-900 to-black p-4">
        <Card className="w-full max-w-md glass-effect neon-border">
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center mx-auto mb-4">
              <Crown className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl text-neon">Premium Necessário</CardTitle>
            <CardDescription>
              Esta funcionalidade está disponível apenas para assinantes Premium
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-gradient-to-br from-[#1E6BFF]/10 to-[#00B7FF]/10 border border-white/10">
              <p className="text-sm text-gray-300 mb-3">Com o plano Premium você tem acesso a:</p>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-green-400" />
                  Treino 100% personalizado
                </li>
                <li className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-green-400" />
                  Dieta inteligente com substitutos
                </li>
                <li className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-green-400" />
                  Módulo de corrida com GPS
                </li>
                <li className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-green-400" />
                  Relatórios em PDF ilimitados
                </li>
                <li className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-green-400" />
                  Sincronização em nuvem
                </li>
              </ul>
            </div>

            <Button onClick={() => navigate('/assinatura')} className="w-full glow-green h-12">
              <Crown className="w-5 h-5 mr-2" />
              Assinar Premium - R$ 97,90/mês
            </Button>

            <Button variant="outline" onClick={() => navigate('/dashboard')} className="w-full">
              Voltar ao Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Tudo ok - mostrar conteúdo
  return <>{children}</>
}
