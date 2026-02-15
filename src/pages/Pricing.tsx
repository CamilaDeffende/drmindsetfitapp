import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useSubscription } from '@/hooks/useSubscription'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Check,
  Zap,
  Dumbbell,
  UtensilsCrossed,
  Activity,
  FileText,
  Edit,
  Cloud,
  Crown,
  ArrowLeft
} from 'lucide-react'
import { loadStripe } from '@stripe/stripe-js'
import { useToast } from '@/hooks/use-toast'

const stripePromise = (import.meta.env.VITE_STRIPE_PUBLIC_KEY ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY) : null)

export function Pricing() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { isPremium, loading: subLoading } = useSubscription()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const handleSubscribe = async () => {
    if (!user) {
      navigate('/signup')
      return
    }

    setLoading(true)

    try {
      // Criar checkout session no backend
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          priceId: import.meta.env.VITE_SUBSCRIPTION_PRICE_ID,
        }),
      })

      const { sessionId } = await response.json()

      // Redirecionar para checkout Stripe
      const stripe = await stripePromise
      if (stripe) {
        // @ts-expect-error - redirectToCheckout existe mas TypeScript não reconhece na versão atual
        const { error } = await stripe.redirectToCheckout({ sessionId })

        if (error) {
          toast({
            title: 'Erro no pagamento',
            description: error.message,
            variant: 'destructive',
          })
        }
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível iniciar o checkout. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white">
      {/* Header */}
      <header className="border-b border-white/10 glass-effect sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1E6BFF] to-[#00B7FF] flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-bold text-neon">DrMindSetfit</h1>
            </div>
            {user && (
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12 sm:py-16">
        {/* Hero */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-gradient-to-r from-[#1E6BFF] via-[#00B7FF] to-[#00B7FF] hover:from-[#1E6BFF] hover:via-[#00B7FF] hover:to-[#00B7FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00B7FF] focus-visible:ring-offset-2 focus-visible:ring-offset-black/0">
            Transforme seu corpo e mente
          </Badge>
          <h2 className="text-4xl sm:text-5xl font-bold mb-4 text-neon">
            Escolha seu plano
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Treinos personalizados, dieta inteligente e acompanhamento completo para você alcançar seus objetivos
          </p>
        </div>

        {/* Planos */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Plano Free */}
          <Card className="glass-effect border-white/20">
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <CardTitle className="text-2xl">Free</CardTitle>
                <Activity className="w-8 h-8 text-gray-400" />
              </div>
              <div className="mb-4">
                <span className="text-4xl font-bold">R$ 0</span>
                <span className="text-gray-400">/mês</span>
              </div>
              <CardDescription>Experimente o básico gratuitamente</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-400" />
                  <span>Dashboard básico</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-400" />
                  <span>Ver exemplos de treino</span>
                </li>
                <li className="flex items-center gap-2 text-gray-500">
                  <span className="w-5 h-5 text-center">×</span>
                  <span>Gerar treino personalizado</span>
                </li>
                <li className="flex items-center gap-2 text-gray-500">
                  <span className="w-5 h-5 text-center">×</span>
                  <span>Gerar dieta personalizada</span>
                </li>
                <li className="flex items-center gap-2 text-gray-500">
                  <span className="w-5 h-5 text-center">×</span>
                  <span>Módulo de corrida</span>
                </li>
                <li className="flex items-center gap-2 text-gray-500">
                  <span className="w-5 h-5 text-center">×</span>
                  <span>Relatórios em PDF</span>
                </li>
              </ul>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate(user ? '/dashboard' : '/signup')}
              >
                {user ? 'Ir para Dashboard' : 'Começar grátis'}
              </Button>
            </CardContent>
          </Card>

          {/* Plano Premium */}
          <Card className="glass-effect border-green-500/50 shadow-[0_0_30px_rgba(34,197,94,0.3)] relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-1 hover:from-[#1E6BFF] hover:via-[#00B7FF] hover:to-[#00B7FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00B7FF] focus-visible:ring-offset-2 focus-visible:ring-offset-black/0">
                <Crown className="w-3 h-3 mr-1" />
                MAIS POPULAR
              </Badge>
            </div>
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <CardTitle className="text-2xl text-neon">Premium</CardTitle>
                <Crown className="w-8 h-8 text-yellow-400" />
              </div>
              <div className="mb-4">
                <span className="text-5xl font-bold text-neon">R$ 97,90</span>
                <span className="text-xl text-gray-400">,99/mês</span>
              </div>
              <CardDescription>Acesso completo a todas as funcionalidades</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-400" />
                  <span className="font-semibold">Tudo do plano Free, mais:</span>
                </li>
                <li className="flex items-center gap-2">
                  <Dumbbell className="w-5 h-5 text-[#1E6BFF]" />
                  <span>Treino 100% personalizado</span>
                </li>
                <li className="flex items-center gap-2">
                  <UtensilsCrossed className="w-5 h-5 text-yellow-400" />
                  <span>Dieta inteligente com substitutos</span>
                </li>
                <li className="flex items-center gap-2">
                  <Edit className="w-5 h-5 text-[#1E6BFF]" />
                  <span>Edição completa de dieta</span>
                </li>
                <li className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-green-400" />
                  <span>Módulo de corrida com GPS</span>
                </li>
                <li className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-orange-400" />
                  <span>Relatórios em PDF ilimitados</span>
                </li>
                <li className="flex items-center gap-2">
                  <Cloud className="w-5 h-5 text-cyan-400" />
                  <span>Sincronização em nuvem</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-400" />
                  <span>Suporte prioritário</span>
                </li>
              </ul>

              {isPremium ? (
                <Button disabled className="w-full h-12 text-lg">
                  <Check className="w-5 h-5 mr-2" />
                  Plano Ativo
                </Button>
              ) : (
                <Button
                  onClick={handleSubscribe}
                  disabled={loading || subLoading}
                  className="w-full glow-green h-12 text-lg"
                >
                  {loading ? 'Carregando...' : 'Assinar Agora'}
                </Button>
              )}

              <p className="text-center text-xs text-gray-400 mt-3">
                Cancele quando quiser • Renovação automática
              </p>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Simples */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h3 className="text-2xl font-bold text-center mb-8 text-neon">Perguntas Frequentes</h3>
          <div className="space-y-4">
            <Card className="glass-effect border-white/10">
              <CardHeader>
                <CardTitle className="text-lg">Posso cancelar a qualquer momento?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">
                  Sim! Você pode cancelar sua assinatura a qualquer momento. O acesso continuará até o fim do período pago.
                </p>
              </CardContent>
            </Card>

            <Card className="glass-effect border-white/10">
              <CardHeader>
                <CardTitle className="text-lg">Como funciona a renovação?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">
                  A assinatura renova automaticamente todo mês. Você receberá um email antes da cobrança.
                </p>
              </CardContent>
            </Card>

            <Card className="glass-effect border-white/10">
              <CardHeader>
                <CardTitle className="text-lg">Meus dados são salvos na nuvem?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">
                  Sim! Com o plano Premium, todos os seus dados ficam salvos e sincronizados entre todos os seus dispositivos.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-16">
        <div className="max-w-7xl mx-auto px-4 py-8 text-center text-sm text-gray-400">
          <p>© 2025 DrMindSetfit. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
