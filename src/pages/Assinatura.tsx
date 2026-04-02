import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { loadFlags, setPaywallEnabled, setPremiumUnlocked } from "@/lib/featureFlags";
import { BrandIcon } from "@/components/branding/BrandIcon";
import { Check, ChevronLeft, Crown, ShieldCheck, Sparkles } from "lucide-react";
import { useDrMindSetfit } from "@/contexts/DrMindSetfitContext";
import { useAuth } from "@/contexts/AuthContext";
import { subscriptionService } from "@/services/subscription/SubscriptionService";
import { setFreeSubscription, setTrialSubscription } from "@/lib/subscription/storage";

type PlanId = "mensal" | "semestral" | "anual";
type AssinaturaSource = "onboarding" | "dashboard-free" | "premium";

type Plan = {
  id: PlanId;
  title: string;
  price: string;
  totalPrice?: string;
  note?: string;
  kicker?: string;
  highlight?: boolean;
  badge?: string;
};

function getSourceFromSearch(search: string): AssinaturaSource | null {
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

function loadOnboardingDraft() {
  try {
    const raw = localStorage.getItem("mf:onboarding:draft:v1");
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function fmtKcal(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? `${Math.round(n)} kcal` : "—";
}

export default function Assinatura() {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useDrMindSetfit();
  const { user } = useAuth() as any;

  const source = getSourceFromSearch(location.search);
  const isDevMode = import.meta.env.DEV;
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const autostartTrial = searchParams.get("autostartTrial") === "1";

  const draft = useMemo(() => loadOnboardingDraft(), []);
  const autoStartRanRef = useRef(false);
  const [startingTrial, setStartingTrial] = useState(false);

  const step1 = draft?.step1 ?? {};
  const step3 = draft?.step3 ?? {};
  const step4 = draft?.step4 ?? {};
  const step5 = draft?.step5 ?? {};
  const step6 = draft?.step6 ?? {};
  const step7 = draft?.step7 ?? {};

  const objetivoLabelMap: Record<string, string> = {
    emagrecimento: "Emagrecimento",
    reposicao: "Recomposicao corporal",
    hipertrofia: "Hipertrofia",
    performance: "Performance",
    longevidade: "Saude / longevidade",
  };

  const dietaLabelMap: Record<string, string> = {
    flexivel: "Flexivel",
    onivoro: "Onivoro",
    lowcarb: "Low carb",
    vegetariano: "Vegetariano",
    vegano: "Vegano",
  };

  const perfil = (state as any)?.perfil ?? {};
  const treino = (state as any)?.treino ?? {};
  const nutricao = (state as any)?.nutricao ?? {};

  const objetivoLabel =
    (perfil as any)?.objetivo ??
    objetivoLabelMap[step1?.objetivo] ??
    "Plano personalizado";

  const modalidadeLabel =
    (perfil as any)?.modalidadePrincipal ??
    step5?.primary ??
    step1?.modalidadePrincipal ??
    "Treino personalizado";

  const diasTreino = Array.isArray((treino as any)?.dias)
    ? (treino as any).dias
    : Array.isArray(step6?.days)
      ? step6.days
      : [];

  const diasTreinoLabel =
    diasTreino.length > 0
      ? diasTreino.map((d: string) => d.toUpperCase()).join(" • ")
      : "Distribuicao automatica";

  const kcalAlvo =
    (nutricao as any)?.macros?.calorias ??
    step4?.kcalAlvo ??
    step4?.macros?.calorias ??
    step3?.metabolismo?.caloriasAlvo ??
    step3?.metabolismo?.get ??
    null;

  const dietaLabel = dietaLabelMap[step7?.dieta] ?? "Plano alimentar personalizado";

  const plans: Plan[] = useMemo(
    () => [
      {
        id: "mensal",
        title: "Plano mensal",
        price: "R$ 49,90/mes",
        note: "30 dias de acesso • Cancelamento a qualquer momento",
        kicker: "Ideal para comecar sem compromisso longo",
      },
      {
        id: "semestral",
        title: "Plano semestral",
        price: "R$ 41,65/mes*",
        totalPrice: "ou R$ 249,90 por 6 meses",
        note: "6 meses de acesso",
        kicker: "Melhor equilibrio entre valor e compromisso",
      },
      {
        id: "anual",
        title: "Plano anual",
        price: "R$ 33,32/mes*",
        totalPrice: "ou R$ 399,90 por 12 meses",
        note: "12 meses de acesso • 12x de R$ 39,90 ou R$ 399,90 a vista",
        kicker: "Apenas R$ 33,32/mes • Economize R$ 198,90 por ano",
        highlight: true,
        badge: "Mais popular",
      },
    ],
    [],
  );

  const benefits = [
    "Plano alimentar personalizado",
    "Treinos completos e ajustaveis",
    "Acompanhamento de evolucao",
    "Atualizacoes e melhorias continuas",
  ];

  const [devFlags, setDevFlags] = useState(() =>
    typeof window !== "undefined"
      ? loadFlags()
      : { paywallEnabled: false, premiumUnlocked: false },
  );

  useEffect(() => {
    try {
      setDevFlags(loadFlags());
    } catch {}
  }, []);

  const activateTrialAndGo = async () => {
    if (!user?.id) return;

    try {
      setStartingTrial(true);
      await subscriptionService.startTrial(user.id);
      setTrialSubscription();

      const cleanParams = new URLSearchParams(location.search);
      cleanParams.delete("autostartTrial");
      const cleanSearch = cleanParams.toString();

      navigate(
        {
          pathname: "/dashboardpremium",
          search: cleanSearch ? `?${cleanSearch}` : "",
        },
        { replace: true },
      );
    } catch (e) {
      console.error("Erro ao iniciar trial:", e);
      alert("Nao foi possivel iniciar o trial agora. Tente novamente.");
      setStartingTrial(false);
    }
  };

  useEffect(() => {
    if (!autostartTrial || !user?.id || autoStartRanRef.current) return;
    autoStartRanRef.current = true;
    void activateTrialAndGo();
  }, [autostartTrial, user?.id]);

  const togglePaywall = () => {
    const next = setPaywallEnabled(!devFlags.paywallEnabled);
    setDevFlags(next);
  };

  const togglePremium = () => {
    const next = setPremiumUnlocked(!devFlags.premiumUnlocked);
    setDevFlags(next);
  };

  const getBackHref = () => {
    if (source === "dashboard-free") return "/dashboard";
    if (source === "premium") return "/dashboardpremium";
    return null;
  };

  const goBack = () => {
    const backHref = getBackHref();
    if (backHref) {
      navigate(backHref, { replace: true });
      return;
    }
    navigate(-1);
  };

  const goToCheckout = (planId: PlanId) => {
    const params = new URLSearchParams();
    params.set("plan", planId);
    if (source) params.set("source", source);
    navigate(`/checkout?${params.toString()}`, { replace: true });
  };

  const goToLogin = () => {
    const nextParams = new URLSearchParams();
    if (source) nextParams.set("source", source);
    if (autostartTrial) nextParams.set("autostartTrial", "1");

    const next = nextParams.toString() ? `/assinatura?${nextParams.toString()}` : "/assinatura";

    const loginParams = new URLSearchParams();
    loginParams.set("next", next);
    if (source) loginParams.set("source", source);
    navigate(`/login?${loginParams.toString()}`, { replace: true });
  };

  const goToSignup = () => {
    const nextParams = new URLSearchParams();
    if (source) nextParams.set("source", source);
    if (autostartTrial) nextParams.set("autostartTrial", "1");

    const next = nextParams.toString() ? `/assinatura?${nextParams.toString()}` : "/assinatura";

    const signupParams = new URLSearchParams();
    signupParams.set("next", next);
    if (source) signupParams.set("source", source);
    navigate(`/signup?${signupParams.toString()}`, { replace: true });
  };

  const startFreeTrial = async () => {
    if (!user?.id) {
      const params = new URLSearchParams();
      if (source) params.set("source", source);
      params.set("autostartTrial", "1");

      const signupParams = new URLSearchParams();
      signupParams.set("next", `/assinatura?${params.toString()}`);
      if (source) signupParams.set("source", source);
      navigate(`/signup?${signupParams.toString()}`, { replace: true });
      return;
    }

    await activateTrialAndGo();
  };

  const continueFree = () => {
    setFreeSubscription();

    if (source === "onboarding") {
      if (user?.id) {
        navigate("/dashboard", { replace: true });
        return;
      }

      const signupParams = new URLSearchParams();
      signupParams.set("next", "/dashboard");
      signupParams.set("source", "onboarding");
      navigate(`/signup?${signupParams.toString()}`, { replace: true });
      return;
    }

    if (source === "dashboard-free" || source === "premium") {
      navigate("/dashboard", { replace: true });
      return;
    }

    const signupParams = new URLSearchParams();
    signupParams.set("next", "/dashboard");
    if (source) signupParams.set("source", source);
    navigate(`/signup?${signupParams.toString()}`, { replace: true });
  };

  return (
    <div className="min-h-dvh mf-app-bg mf-bg-neon text-white">
      <div className="mx-auto w-full max-w-[920px] px-4 pb-10 pt-8">
        <div className="flex items-center gap-3">
          <BrandIcon size={80} className="drop-shadow-[0_0_16px_rgba(0,190,255,0.35)]" />

          <div className="min-w-0">
            <div className="text-[14px] font-semibold tracking-tight text-white/90">
              Assinatura
            </div>
            <div className="text-[12px] text-white/60">MindsetFit • Premium</div>
          </div>

          {source !== "onboarding" ? (
            <button
              type="button"
              onClick={goBack}
              className="ml-auto inline-flex items-center rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[12px] font-semibold text-white/85 hover:bg-white/10 active:scale-[0.99]"
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Voltar
            </button>
          ) : null}
        </div>

        <div className="mt-6 rounded-[28px] border border-white/10 bg-[rgba(8,10,18,0.82)] p-6 shadow-[0_0_40px_rgba(0,149,255,0.08)]">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold text-cyan-300">
            <Crown className="h-3.5 w-3.5" />
            Premium desbloqueado sob demanda
          </div>

          <h1 className="text-[28px] leading-[1.05] font-semibold tracking-tight text-white">
            Desbloqueie seu plano completo
          </h1>

          <p className="mt-3 text-[14px] leading-6 text-white/60">
            Acesse dieta personalizada, treinos completos e evolucao continua com base no seu perfil.
          </p>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {benefits.map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3"
              >
                <div className="flex items-start gap-2">
                  <div className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border border-emerald-400 bg-emerald-400 text-black">
                    <Check className="h-3 w-3" />
                  </div>
                  <div className="text-[13px] text-white/80">{item}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 border-t border-white/10 pt-5">
            <div className="text-[11px] uppercase tracking-[0.18em] text-emerald-300/80">
              Seu plano ja esta pronto
            </div>

            <h2 className="mt-1 text-[18px] font-semibold text-white">
              Falta so desbloquear o acesso premium
            </h2>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-[11px] text-white/40">Objetivo</div>
                <div className="mt-1 text-[15px] font-semibold text-white capitalize">
                  {String(objetivoLabel).replace("-", " ")}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-[11px] text-white/40">Meta diaria</div>
                <div className="mt-1 text-[15px] font-semibold text-white">
                  {fmtKcal(kcalAlvo)}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-[11px] text-white/40">Modalidade</div>
                <div className="mt-1 text-[15px] font-semibold text-white capitalize">
                  {String(modalidadeLabel).replace("-", " ")}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-[11px] text-white/40">Dias de treino</div>
                <div className="mt-1 text-[15px] font-semibold text-white">
                  {diasTreinoLabel}
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-cyan-300/15 bg-cyan-400/10 px-4 py-3 text-[13px] text-cyan-100/90">
              Ao assinar, voce libera imediatamente o dashboard premium, treino completo e plano alimentar ajustado ao seu perfil.
            </div>

            <div className="mt-3 text-[12px] text-white/45">
              Estilo alimentar previsto:{" "}
              <span className="font-semibold text-white/75">{dietaLabel}</span>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-[28px] border border-emerald-400/25 bg-[linear-gradient(180deg,rgba(16,40,30,0.7),rgba(8,10,18,0.92))] p-5 shadow-[0_0_30px_rgba(34,197,94,0.10)]">
          <div className="inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
            Trial gratis
          </div>

          <div className="mt-3 text-[22px] font-semibold tracking-tight text-white">
            Teste premium por 7 dias
          </div>

          <div className="mt-2 text-[13px] leading-6 text-white/60">
            Libere agora o dashboard premium e experimente o app completo antes de decidir.
          </div>

          <button
            type="button"
            onClick={startFreeTrial}
            disabled={startingTrial}
            className="mt-5 inline-flex w-full items-center justify-center overflow-hidden rounded-[20px] border-0 bg-gradient-to-r from-[#193B72] via-[#255AA8] to-[#7FE9D6] px-4 py-3 text-[14px] font-semibold text-white shadow-[0_10px_30px_rgba(0,149,255,0.18)] transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {startingTrial ? "Ativando trial..." : "Testar gratis por 7 dias"}
          </button>

          <div className="mt-2 text-center text-[11px] text-white/45">
            Sem pagamento agora. Apos 7 dias, voce escolhe se quer continuar.
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-3">
          {plans.map((pl) => (
            <div
              key={pl.id}
              className={[
                "relative flex h-full flex-col overflow-hidden rounded-[26px] border p-4 shadow-[0_0_32px_rgba(0,149,255,0.06)]",
                pl.highlight
                  ? "border-emerald-400/30 bg-[linear-gradient(180deg,rgba(16,40,30,0.7),rgba(8,10,18,0.9))] shadow-[0_0_30px_rgba(34,197,94,0.10)]"
                  : "border-white/10 bg-[rgba(8,10,18,0.82)]",
              ].join(" ")}
            >
              {pl.badge ? (
                <div className="mb-4 inline-flex self-start rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
                  {pl.badge}
                </div>
              ) : null}

              <div className="font-semibold text-white">{pl.title}</div>
              <div className="mt-2 text-[26px] font-semibold tracking-tight text-white">
                {pl.price}
              </div>
              {pl.totalPrice ? (
                <div className="mt-1 text-[13px] font-medium text-white/78">{pl.totalPrice}</div>
              ) : null}
              <div className="mt-3 text-[12px] leading-6 text-white/60">{pl.note}</div>

              {pl.kicker ? (
                <div
                  className={[
                    "mt-3 rounded-2xl border px-3 py-2 text-[11px] font-medium",
                    pl.highlight
                      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
                      : "border-white/10 bg-white/[0.03] text-white/70",
                  ].join(" ")}
                >
                  {pl.kicker}
                </div>
              ) : null}

              <div className="mt-auto flex flex-col gap-3 pt-5">
                <button
                  type="button"
                  className={[
                    "inline-flex w-full items-center justify-center rounded-[20px] px-4 py-3 text-[13px] font-semibold transition-all active:scale-[0.99]",
                    pl.highlight
                      ? "overflow-hidden border-0 bg-gradient-to-r from-[#193B72] via-[#255AA8] to-[#7FE9D6] text-white shadow-[0_10px_30px_rgba(0,149,255,0.18)] hover:brightness-110"
                      : "bg-white text-black hover:opacity-95",
                  ].join(" ")}
                  onClick={() => goToCheckout(pl.id)}
                >
                  Assinar agora
                </button>

                {pl.id === "anual" ? (
                  <div className="flex items-start gap-2 text-[10px] leading-5 text-white/50 sm:text-[11px]">
                    <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
                    Melhor valor para uso continuo do app
                  </div>
                ) : (
                  <div className="flex items-start gap-2 text-[10px] leading-5 text-white/50 sm:text-[11px]">
                    <ShieldCheck className="h-3.5 w-3.5 text-cyan-300" />
                    {pl.id === "semestral"
                      ? "Compromisso intermediario com economia real"
                      : "Flexibilidade para comecar sem compromisso longo"}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 text-center text-[11px] text-white/45">
          * Valor mensal equivalente ao periodo contratado.
        </div>

        <div className="mt-5 rounded-[24px] border border-white/10 bg-[rgba(8,10,18,0.82)] p-4 shadow-[0_0_32px_rgba(0,149,255,0.04)]">
          {source === "onboarding" ? (
            <div className="flex flex-col gap-3">
              <button
                type="button"
                className="inline-flex w-full items-center justify-center rounded-[20px] bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 px-4 py-3 text-[13px] font-semibold text-slate-950 shadow-[0_12px_32px_rgba(22,163,255,0.28)] transition hover:brightness-105 active:scale-[0.99]"
                onClick={goToSignup}
              >
                Criar conta e continuar
              </button>

              <button
                type="button"
                className="inline-flex w-full items-center justify-center rounded-[20px] border border-white/15 bg-white/5 px-4 py-3 text-[13px] font-semibold text-white/90 hover:bg-white/10 active:scale-[0.99]"
                onClick={goToLogin}
              >
                Ja tenho login
              </button>

              <button
                type="button"
                className="inline-flex w-full items-center justify-center rounded-[20px] border border-white/15 bg-white/5 px-4 py-3 text-[13px] font-semibold text-white/90 hover:bg-white/10 active:scale-[0.99]"
                onClick={continueFree}
              >
                Continuar sem premium
              </button>

              <div className="text-center text-[11px] text-white/50">
                Voce ainda podera assinar depois dentro do app.
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <button
                type="button"
                className="inline-flex w-full items-center justify-center rounded-[20px] border border-white/15 bg-white/5 px-4 py-3 text-[13px] font-semibold text-white/90 hover:bg-white/10 active:scale-[0.99]"
                onClick={continueFree}
              >
                Agora nao
              </button>

              <div className="text-center text-[11px] text-white/50">
                Voce pode voltar e continuar usando o app no modo atual.
              </div>
            </div>
          )}
        </div>

        {isDevMode ? (
          <div className="mt-6 rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
            <div className="text-[13px] font-semibold text-white/90">Modo DEV</div>
            <div className="mt-1 text-[12px] text-white/60">
              Controles internos para teste de paywall e premium.
            </div>

            <div className="mt-4 flex items-center justify-between gap-4">
              <div>
                <div className="text-[14px] font-semibold">Liberar Premium</div>
                <div className="mt-1 text-[12px] text-white/70">Apenas para testes internos.</div>
              </div>

              <button
                type="button"
                onClick={togglePremium}
                className="inline-flex items-center rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-[12px] font-semibold text-white/90 hover:bg-white/15 active:scale-[0.99]"
              >
                {devFlags.premiumUnlocked ? "Ativo" : "Inativo"}
              </button>
            </div>

            <div className="mt-4 flex items-center justify-between gap-4">
              <div>
                <div className="text-[14px] font-semibold">Paywall</div>
                <div className="mt-1 text-[12px] text-white/70">
                  Quando ativo, recursos premium redirecionam para /assinatura.
                </div>
              </div>

              <button
                type="button"
                onClick={togglePaywall}
                className="inline-flex items-center rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-[12px] font-semibold text-white/90 hover:bg-white/15 active:scale-[0.99]"
              >
                {devFlags.paywallEnabled ? "Ativo" : "Inativo"}
              </button>
            </div>

            <div className="mt-4 text-[12px] text-white/60">
              Estado:{" "}
              <span className="font-semibold text-white/80">
                {devFlags.paywallEnabled ? "paywall ON" : "paywall OFF"}
              </span>{" "}
              •{" "}
              <span className="font-semibold text-white/80">
                {devFlags.premiumUnlocked ? "premium ON" : "premium OFF"}
              </span>
            </div>
          </div>
        ) : null}

        <div className="mt-6 text-center text-[11px] text-white/40">MindsetFit • Premium</div>
      </div>
    </div>
  );
}
