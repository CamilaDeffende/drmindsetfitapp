import { useMemo } from "react";
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

type PlanId = "mensal" | "anual";
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
    price: "R$ 97,90",
    description: "Acesso premium por 30 dias.",
    benefits: [
      "Dashboard premium completo",
      "Treino personalizado",
      "Dieta personalizada",
      "Relatorios e PDFs",
      "Recursos premium liberados",
    ],
  },
  anual: {
    id: "anual",
    title: "Plano Anual",
    price: "R$ 597,90",
    description: "Acesso premium por 12 meses.",
    benefits: [
      "Dashboard premium completo",
      "Treino personalizado",
      "Dieta personalizada",
      "Relatorios e PDFs",
      "Recursos premium liberados",
      "Melhor custo-beneficio",
    ],
  },
};

function getPlanFromSearch(search: string): PlanId {
  try {
    const raw = new URLSearchParams(search).get("plan");
    if (raw === "anual") return "anual";
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

  const planId = useMemo(() => getPlanFromSearch(location.search), [location.search]);
  const source = useMemo(() => getSourceFromSearch(location.search), [location.search]);
  const plan = PLANS[planId];
  const paymentProvider = readPaymentProvider();
  const paymentProviderLabel = getPaymentProviderLabel(paymentProvider);
  const paymentProviderReady = hasConfiguredPaymentProvider();

  const handleConfirmPayment = () => {
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
                <CardTitle className="text-xl">Checkout</CardTitle>
                <CardDescription className="text-white/60">
                  Confirme seu plano premium
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
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
                {paymentProviderReady ? "Continuar pagamento" : "Voltar para assinatura"}
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
                ? `Fluxo preparado para ${paymentProviderLabel}. O backend final ainda precisa validar o pagamento.`
                : "Esta tela esta em modo de preparacao. O gateway real ainda precisa ser conectado antes do lancamento."}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
