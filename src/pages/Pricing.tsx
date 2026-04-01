import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import {
  Activity,
  ArrowLeft,
  Check,
  Cloud,
  Crown,
  Dumbbell,
  Edit,
  FileText,
  UtensilsCrossed,
  Zap,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getPaymentProviderLabel,
  hasConfiguredPaymentProvider,
  hasStripeCheckoutConfig,
  readPaymentProvider,
} from "@/lib/payments/config";

const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
  : null;

export function Pricing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isPremium, loading: subLoading } = useSubscription();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const paymentProvider = readPaymentProvider();
  const paymentProviderLabel = getPaymentProviderLabel(paymentProvider);
  const paymentProviderReady = hasConfiguredPaymentProvider();

  const handleSubscribe = async () => {
    if (!user) {
      navigate("/signup");
      return;
    }

    if (paymentProvider !== "stripe") {
      navigate("/checkout?plan=mensal&source=premium");
      return;
    }

    if (!hasStripeCheckoutConfig()) {
      toast({
        title: "Gateway pendente",
        description: "Configure as credenciais do Stripe para iniciar o checkout real.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          priceId: import.meta.env.VITE_SUBSCRIPTION_PRICE_ID,
        }),
      });

      const { sessionId } = await response.json();
      const stripe = await stripePromise;

      if (stripe) {
        // @ts-expect-error redirectToCheckout exists at runtime for Stripe.js
        const { error } = await stripe.redirectToCheckout({ sessionId });

        if (error) {
          toast({
            title: "Erro no pagamento",
            description: error.message,
            variant: "destructive",
          });
        }
      }
    } catch {
      toast({
        title: "Erro",
        description: "Nao foi possivel iniciar o checkout. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white">
      <header className="glass-effect sticky top-0 z-50 border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#1E6BFF] to-[#00B7FF]">
              <Zap className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-bold text-neon">DrMindSetfit</h1>
          </div>

          {user ? (
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
          ) : null}
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-12 sm:py-16">
        <div className="mb-12 text-center">
          <Badge className="mb-4 bg-gradient-to-r from-[#1E6BFF] via-[#00B7FF] to-[#00B7FF] text-white">
            Transforme seu corpo e mente
          </Badge>
          <h2 className="mb-4 text-4xl font-bold text-neon sm:text-5xl">Escolha seu plano</h2>
          <p className="mx-auto max-w-2xl text-xl text-gray-400">
            Treinos personalizados, dieta inteligente e acompanhamento completo para voce alcancar seus objetivos.
          </p>
        </div>

        <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-2">
          <Card className="glass-effect border-white/20">
            <CardHeader>
              <div className="mb-2 flex items-center justify-between">
                <CardTitle className="text-2xl">Free</CardTitle>
                <Activity className="h-8 w-8 text-gray-400" />
              </div>
              <div className="mb-4">
                <span className="text-4xl font-bold">R$ 0</span>
                <span className="text-gray-400">/mes</span>
              </div>
              <CardDescription>Experimente o basico gratuitamente</CardDescription>
            </CardHeader>

            <CardContent>
              <ul className="mb-6 space-y-3">
                <li className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-400" />
                  <span>Dashboard basico</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-400" />
                  <span>Ver exemplos de treino</span>
                </li>
                <li className="flex items-center gap-2 text-gray-500">
                  <span className="w-5 text-center">x</span>
                  <span>Gerar treino personalizado</span>
                </li>
                <li className="flex items-center gap-2 text-gray-500">
                  <span className="w-5 text-center">x</span>
                  <span>Gerar dieta personalizada</span>
                </li>
                <li className="flex items-center gap-2 text-gray-500">
                  <span className="w-5 text-center">x</span>
                  <span>Modulo de corrida</span>
                </li>
                <li className="flex items-center gap-2 text-gray-500">
                  <span className="w-5 text-center">x</span>
                  <span>Relatorios em PDF</span>
                </li>
              </ul>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate(user ? "/dashboard" : "/signup")}
              >
                {user ? "Ir para Dashboard" : "Comecar gratis"}
              </Button>
            </CardContent>
          </Card>

          <Card className="glass-effect relative border-green-500/50 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 px-4 py-1 text-white">
                <Crown className="mr-1 h-3 w-3" />
                MAIS POPULAR
              </Badge>
            </div>

            <CardHeader>
              <div className="mb-2 flex items-center justify-between">
                <CardTitle className="text-2xl text-neon">Premium</CardTitle>
                <Crown className="h-8 w-8 text-yellow-400" />
              </div>
              <div className="mb-4">
                <span className="text-5xl font-bold text-neon">R$ 49,90</span>
                <span className="text-xl text-gray-400">/mes</span>
              </div>
              <CardDescription>
                Acesso completo com opcoes mensal, semestral e anual.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <ul className="mb-6 space-y-3">
                <li className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-400" />
                  <span className="font-semibold">Tudo do plano Free, mais:</span>
                </li>
                <li className="flex items-center gap-2">
                  <Dumbbell className="h-5 w-5 text-[#1E6BFF]" />
                  <span>Treino 100% personalizado</span>
                </li>
                <li className="flex items-center gap-2">
                  <UtensilsCrossed className="h-5 w-5 text-yellow-400" />
                  <span>Dieta inteligente com substitutos</span>
                </li>
                <li className="flex items-center gap-2">
                  <Edit className="h-5 w-5 text-[#1E6BFF]" />
                  <span>Edicao completa de dieta</span>
                </li>
                <li className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-green-400" />
                  <span>Modulo de corrida com GPS</span>
                </li>
                <li className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-orange-400" />
                  <span>Relatorios em PDF ilimitados</span>
                </li>
                <li className="flex items-center gap-2">
                  <Cloud className="h-5 w-5 text-cyan-400" />
                  <span>Sincronizacao em nuvem</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-400" />
                  <span>Suporte prioritario</span>
                </li>
              </ul>

              {isPremium ? (
                <Button disabled className="h-12 w-full text-lg">
                  <Check className="mr-2 h-5 w-5" />
                  Plano ativo
                </Button>
              ) : (
                <Button
                  onClick={handleSubscribe}
                  disabled={loading || subLoading}
                  className="glow-green h-12 w-full text-lg"
                >
                  {loading
                    ? "Carregando..."
                    : paymentProvider === "stripe"
                      ? "Assinar agora"
                      : "Continuar para pagamento"}
                </Button>
              )}

              <p className="mt-3 text-center text-xs text-gray-400">
                {paymentProviderReady
                  ? `Checkout preparado com ${paymentProviderLabel}.`
                  : "Cancele quando quiser e escolha o plano ideal para sua jornada."}
              </p>
              <p className="mt-2 text-center text-xs text-emerald-300/90">
                Plano anual com melhor custo-beneficio: apenas R$ 33,32/mes e economia de R$ 198,90 por ano.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mx-auto mt-16 max-w-3xl">
          <h3 className="mb-8 text-center text-2xl font-bold text-neon">Perguntas frequentes</h3>

          <div className="space-y-4">
            <Card className="glass-effect border-white/10">
              <CardHeader>
                <CardTitle className="text-lg">Posso cancelar a qualquer momento?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">
                  Sim. Voce pode cancelar sua assinatura a qualquer momento. O acesso continua ativo ate o fim do periodo contratado.
                </p>
              </CardContent>
            </Card>

            <Card className="glass-effect border-white/10">
              <CardHeader>
                <CardTitle className="text-lg">Como funciona a renovacao?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">
                  O plano escolhido segue o periodo contratado. Quando integrarmos o gateway final, a renovacao sera refletida automaticamente no app.
                </p>
              </CardContent>
            </Card>

            <Card className="glass-effect border-white/10">
              <CardHeader>
                <CardTitle className="text-lg">Meus dados ficam salvos na nuvem?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">
                  Sim. Com o plano Premium, seus dados continuam vinculados a conta e ficam disponiveis para restaurar o progresso quando voce voltar ao app.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <footer className="mt-16 border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-8 text-center text-sm text-gray-400">
          <p>© 2026 DrMindSetfit. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
