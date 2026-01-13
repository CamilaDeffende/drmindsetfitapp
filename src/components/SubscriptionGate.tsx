import React from "react";
import { useSubscription } from "@/lib/subscription/useSubscription";

const priceRow = (label: string, price: string, hint?: string) => (
  <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
    <div>
      <div className="text-sm font-semibold text-white/90">{label}</div>
      {hint ? <div className="text-xs text-white/60">{hint}</div> : null}
    </div>
    <div className="text-sm text-white/85">{price}</div>
  </div>
);

export function SubscriptionGate({ children }: { children: React.ReactNode }) {
  const { sub, active, activate } = useSubscription();

  if (active) return <>{children}</>;

  const expText = sub?.expiresAtISO ? new Date(sub.expiresAtISO).toLocaleString() : "—";

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-[520px] px-4 py-10">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg">
          <div className="text-[12px] uppercase tracking-wider text-white/50">DrMindSetFit</div>
          <div className="mt-2 text-2xl font-extrabold text-white/95">Assinatura necessária</div>
          <div className="mt-2 text-sm text-white/70">
            O acesso ao app é <b>100% premium</b>. Ative sua assinatura para continuar.
          </div>

          <div className="mt-5 grid gap-3">
            {priceRow("Mensal", "R$ 97,90/mês")}
            {priceRow("Anual (12 meses)", "R$ 597,90", "equivale a ~R$ 49,82/mês")}
          </div>

          <div className="mt-5 grid gap-3">
            <button
              type="button"
              onClick={() => activate("monthly")}
              className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold text-white/90 hover:bg-white/15 active:scale-[0.99] transition"
            >
              Ativar plano Mensal
            </button>
            <button
              type="button"
              onClick={() => activate("annual")}
              className="w-full rounded-2xl border border-[#0095FF]/30 bg-[#0095FF]/15 px-4 py-3 text-sm font-semibold text-white hover:bg-[#0095FF]/20 active:scale-[0.99] transition"
            >
              Ativar plano Anual (12 meses)
            </button>
          </div>

          <div className="mt-5 rounded-2xl border border-white/10 bg-black/30 p-4">
            <div className="text-xs text-white/60">Status</div>
            <div className="mt-1 text-sm text-white/85">
              {sub ? (
                <>
                  Assinatura encontrada, mas <b>inativa/expirada</b>. Expira/expirou em: {expText}
                </>
              ) : (
                <>Nenhuma assinatura ativa encontrada neste dispositivo.</>
              )}
            </div>
          </div>

          <div className="mt-4 text-[12px] text-white/45">
            * Nesta fase, a ativação é local (sem login) para validação do fluxo. Checkout real entra no próximo sprint.
          </div>
        </div>
      </div>
    </div>
  );
}
