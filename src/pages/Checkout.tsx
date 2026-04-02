import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BrandIcon } from "@/components/branding/BrandIcon";
import { useToast } from "@/hooks/use-toast";
import {
  getPaymentProviderLabel,
  hasConfiguredPaymentProvider,
  readPaymentProvider,
} from "@/lib/payments/config";

type PlanId = "mensal" | "semestral" | "anual";
type SourceId = "onboarding" | "dashboard-free" | "premium" | null;

type PlanConfig = {
  id: PlanId;
  title: string;
  price: string;
  description: string;
  benefits: string[];
};

const PLANS: Record<PlanId, PlanConfig> = {
  mensal: {
    id: "mensal",
    title: "Plano Mensal",
    price: "R$ 49,90",
    description: "Acesso premium por 30 dias com cancelamento a qualquer momento.",
    benefits: [
      "Dashboard premium completo",
      "Treino personalizado",
      "Dieta personalizada",
      "Relatorios e PDFs",
      "Recursos premium liberados",
    ],
  },
  semestral: {
    id: "semestral",
    title: "Plano Semestral",
    price: "R$ 249,90",
    description: "Acesso premium por 6 meses. Equivale a R$ 41,65 por mes.",
    benefits: [
      "Dashboard premium completo",
      "Treino personalizado",
      "Dieta personalizada",
      "Relatorios e PDFs",
      "Recursos premium liberados",
      "Melhor equilibrio entre valor e compromisso",
    ],
  },
  anual: {
    id: "anual",
    title: "Plano Anual",
    price: "R$ 399,90",
    description: "Acesso premium por 12 meses. Apenas R$ 33,32 por mes no melhor plano.",
    benefits: [
      "Dashboard premium completo",
      "Treino personalizado",
      "Dieta personalizada",
      "Relatorios e PDFs",
      "Recursos premium liberados",
      "Economia de R$ 198,90 em relacao ao mensal",
    ],
  },
};

function getPlanFromSearch(search: string): PlanId {
  try {
    const raw = new URLSearchParams(search).get("plan");
    if (raw === "anual") return "anual";
    if (raw === "semestral") return "semestral";
    return "mensal";
  } catch {
    return "mensal";
  }
}

function getSourceFromSearch(search: string): SourceId {
  try {
    const raw = new URLSearchParams(search).get("source");
    if (raw === "onboarding") return "onboarding";
    if (raw === "dashboard-free") return "dashboard-free";
    if (raw === "premium") return "premium";
    return null;
  } catch {
    return null;
  }
}

export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth() as any;
  const { toast } = useToast();
  const [redirecting, setRedirecting] = useState(false);

  const planId = useMemo(() => getPlanFromSearch(location.search), [location.search]);
  const source = useMemo(() => getSourceFromSearch(location.search), [location.search]);
  const paymentStatus = useMemo(
    () => new URLSearchParams(location.search).get("status"),
    [location.search],
  );
  const plan = PLANS[planId];
  const paymentProvider = readPaymentProvider();
  const paymentProviderLabel = getPaymentProviderLabel(paymentProvider);
  const paymentProviderReady = hasConfiguredPaymentProvider();

  const handleConfirmPayment = async () => {
    if (paymentProvider === "mercadopago" && paymentProviderReady) {
      if (!user?.id) {
        navigate(
          `/signup?next=${encodeURIComponent(`/checkout?plan=${plan.id}&source=${source ?? "premium"}`)}`,
          { replace: true },
        );
        return;
      }

      try {
        setRedirecting(true);

        const response = await fetch("/api/mercadopago/create-preference", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            planId: plan.id,
            source: source ?? "premium",
            userId: user.id,
            email: user.email,
            name:
              user.user_metadata?.full_name ??
              user.user_metadata?.name ??
              "",
          }),
        });

        const payload = await response.json();
        if (!response.ok || !payload?.initPoint) {
          throw new Error(payload?.error ?? "Nao foi possivel criar o checkout do Mercado Pago.");
        }

        window.location.href = payload.initPoint;
        return;
      } catch (error: any) {
        toast({
          title: "Erro no pagamento",
          description: String(error?.message ?? error),
          variant: "destructive",
        });
      } finally {
        setRedirecting(false);
      }

      return;
    }

    if (paymentProviderReady) {
      toast({
        title: "Integracao pendente",
        description: `O checkout com ${paymentProviderLabel} ja esta preparado, mas ainda falta a validacao final do pagamento.`,
        variant: "destructive",
      });
      return;
    }

    if (user) {
      navigate("/assinatura", { replace: true });
      return;
    }

    navigate(
      `/signup?next=${encodeURIComponent("/assinatura")}&plan=${encodeURIComponent(plan.id)}`,
      { replace: true },
    );
  };

  const handleBack = () => {
    const params = new URLSearchParams();
    if (source) params.set("source", source);
    const suffix = params.toString() ? `?${params.toString()}` : "";
    navigate(`/assinatura${suffix}`, { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#070A12] text-white flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <Card className="border-white/10 bg-white/[0.04] shadow-[0_20px_60px_-30px_rgba(0,149,255,0.35)]">
          <CardHeader>
            <div className="flex items-center gap-3">
              <BrandIcon size={28} />
              <div>
                <CardTitle className="text-xl">Checkout MP V2</CardTitle>
                <CardDescription className="text-white/60">
                  Confirme seu plano premium
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {paymentStatus ? (
              <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4 text-sm text-cyan-100">
                {paymentStatus === "success"
                  ? "Pagamento enviado com sucesso. Estamos confirmando sua assinatura."
                  : paymentStatus === "pending"
                    ? "Seu pagamento ficou pendente. Assim que o Mercado Pago confirmar, o premium sera liberado."
                    : "O pagamento nao foi concluido. Voce pode tentar novamente quando quiser."}
              </div>
            ) : null}

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm text-white/60">Plano selecionado</div>
              <div className="mt-1 text-xl font-semibold">{plan.title}</div>
              <div className="mt-2 text-2xl font-bold">{plan.price}</div>
              <div className="mt-2 text-sm text-white/70">{plan.description}</div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm font-semibold mb-3">O que esta incluido</div>
              <ul className="space-y-2 text-sm text-white/80">
                {plan.benefits.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                onClick={handleConfirmPayment}
                className="w-full h-12 text-base font-semibold"
              >
                {redirecting
                  ? "Redirecionando..."
                  : paymentProvider === "mercadopago" && paymentProviderReady
                    ? "Ir para Mercado Pago"
                    : paymentProviderReady
                      ? "Continuar pagamento"
                      : "Voltar para assinatura"}
              </Button>

              <Button
                variant="outline"
                onClick={handleBack}
                className="w-full h-12"
              >
                Voltar
              </Button>
            </div>

            <p className="text-xs text-center text-white/45">
              {paymentProviderReady
                ? paymentProvider === "mercadopago"
                  ? `Fluxo preparado para ${paymentProviderLabel}. A liberacao premium depende da confirmacao do webhook.`
                  : `Fluxo preparado para ${paymentProviderLabel}. O backend final ainda precisa validar o pagamento.`
                : "Esta tela esta em modo de preparacao. O gateway real ainda precisa ser conectado antes do lancamento."}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
