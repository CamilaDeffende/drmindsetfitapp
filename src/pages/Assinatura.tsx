import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { loadFlags, setPaywallEnabled, setPremiumUnlocked } from "@/lib/featureFlags";
import { BrandIcon } from "@/components/branding/BrandIcon";

type Plan = {
  id: "mensal" | "semestral" | "anual";
  title: string;
  price: string;
  note?: string;
  highlight?: boolean;
};

export default function Assinatura() {
  
  
  const navigate = useNavigate();

  const activateAndGoLogin = (planId?: string) => {
    try { localStorage.setItem("mindsetfit:isSubscribed", "true"); } catch {}
    try { localStorage.setItem("mindsetfit:subscription:v1", JSON.stringify({ planId: planId || "mensal", active: true, activatedAt: Date.now() })); } catch {}
    navigate("/login", { replace: true });
  };

  // TS: garante uso (sem alterar UI)
  void activateAndGoLogin;
const plans: Plan[] = useMemo(
    () => [
      { id: "mensal", title: "Mensal", price: "R$ 97,90", note: "30 dias de acesso • Cancelamento a qualquer momento" }
,
      { id: "anual", title: "Anual", price: "R$ 597,90", note: "12 meses de acesso • Plano anual" },
    ],
    []
  );

  const [devFlags, setDevFlags] = useState(() =>
    typeof window !== "undefined" ? loadFlags() : { paywallEnabled: false, premiumUnlocked: false }
  );

  useEffect(() => {
    try {
      setDevFlags(loadFlags());
    } catch {}
  }, []);

  const togglePaywall = () => {
    const next = setPaywallEnabled(!devFlags.paywallEnabled);
    setDevFlags(next);
  };

  const togglePremium = () => {
    const next = setPremiumUnlocked(!devFlags.premiumUnlocked);
    setDevFlags(next);
  };

  return (
<div className="min-h-dvh bg-[#070A12] text-white">
      <div className="mx-auto w-full max-w-[520px] px-4 pb-10 pt-8">
        <div className="flex items-center gap-3">
          <div className="shrink-0">
            <BrandIcon size={28} />
          </div>
          <div className="min-w-0">
            <div className="text-[14px] font-semibold tracking-tight text-white/90">Assinatura</div>
            <div className="text-[12px] text-white/60">MindsetFit • Premium</div>
          </div>

          <a
            href="/dashboard"
            className="ml-auto inline-flex items-center rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[12px] font-semibold text-white/85 hover:bg-white/10 active:scale-[0.99]"
          >
            Voltar
          </a>
        </div>

        <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_20px_60px_-30px_rgba(0,149,255,0.35)]">
          <div className="text-[16px] font-semibold">Desbloqueie o Premium</div>
          <div className="mt-1 text-[12px] text-white/65">
            Exporte PDFs premium, acesse melhorias contínuas e recursos avançados.
          </div>

          <div className="mt-5 grid gap-3">
            {plans.map((pl) => (
              <div
                key={pl.id}
                className={[
                  "rounded-2xl border p-4",
                  pl.highlight
                    ? "border-[#0095FF]/40 bg-[#0095FF]/10"
                    : "border-white/10 bg-white/5",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[14px] font-semibold">{pl.title}</div>
                    <div className="mt-1 text-[12px] text-white/65">{pl.note}</div>
                  </div>

                  <div className="text-right">
                    <div className="text-[14px] font-semibold text-white/90">{pl.price}</div>
                    {pl.highlight ? (
                      <div className="mt-1 inline-flex rounded-full border border-[#0095FF]/35 bg-[#0095FF]/15 px-2 py-0.5 text-[10px] font-semibold text-white/85">
                        Recomendado
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    className="inline-flex w-full items-center justify-center rounded-2xl bg-white px-4 py-2.5 text-[12px] font-semibold text-black hover:opacity-95 active:scale-[0.99]"
                    onClick={() => { activateAndGoLogin(pl.id); }}
                  >
                    Assinar {pl.title}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* DEV controls (sem login) */}
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-[14px] font-semibold">Liberar Premium (DEV)</div>
              <div className="mt-1 text-[12px] text-white/70">Apenas para testes internos. Salvo no dispositivo.</div>
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
              <div className="mt-1 text-[12px] text-white/70">Quando ativo, recursos premium redirecionam para /assinatura.</div>
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

        <div className="mt-6 text-center text-[11px] text-white/45">
          MindsetFit • Premium Layer (next)
        </div>
      </div>
    </div>
  );
}
