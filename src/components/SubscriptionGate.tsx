import React from "react";
import { readSubscriptionMode, writeSubscriptionMode } from "@/lib/subscription/config";
import { useSubscription } from "@/lib/subscription/useSubscription";

function useHashRoute_10c() {
  const get = () => (typeof window !== "undefined" ? window.location.hash || "" : "");
  const [hash, setHash] = React.useState(get);
  React.useEffect(() => {
    const on = () => setHash(get());
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  const is = (p: string) => hash.includes(p);
  const go = (p: string) => { try { window.location.hash = p; } catch { /* noop */ } };
  return { hash, is, go };
}

const fmtBRL = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

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

  const route_10c = useHashRoute_10c();
  const [mode_10c, setMode_10c] = React.useState<"local" | "checkout">(() => {
    try { return readSubscriptionMode(); } catch { return "local"; }
  });

  React.useEffect(() => {
    try { writeSubscriptionMode(mode_10c); } catch { /* noop */ }
  }, [mode_10c]);

  if (active) return <>{children}</>;

  const expText = sub?.expiresAtISO ? new Date(sub.expiresAtISO).toLocaleString() : "—";

  // Sprint 10C: tela “/assinatura” (hash) dentro do gate — router-agnostic
  const isAssinatura = route_10c.is("/assinatura");
  const mensal = 97.9;
  const anual = 597.9;
  const mensalEqAnual = anual / 12;

  if (isAssinatura) {
    return (
      <div className="min-h-screen bg-black text-white" data-ui="subscription-10c">
        <div className="mx-auto max-w-[720px] px-4 py-10">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[12px] uppercase tracking-wider text-white/50">DrMindSetFit</div>
              <div className="mt-2 text-2xl font-extrabold text-white/95">Assinatura</div>
              <div className="mt-1 text-sm text-white/70">
                Acesso total ao app (sem plano free).
              </div>
            </div>
            <button
              type="button"
              onClick={() => route_10c.go("#/")}
              className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-white/85 hover:bg-white/15 active:scale-[0.99] transition"
            >
              Voltar
            </button>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="text-[12px] uppercase tracking-wider text-white/50">Planos</div>
              <div className="mt-4 grid gap-3">
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-white/90">Mensal</div>
                    <div className="text-sm text-white/85">{fmtBRL(mensal)}/mês</div>
                  </div>
                  <div className="mt-1 text-xs text-white/60">Renova automaticamente.</div>
                  <button
                    type="button"
                    onClick={() => {
                      if (mode_10c === "checkout") {
                        alert("Checkout real ainda não conectado. (Sprint 10D)\nPor enquanto, troque o modo para Local ou conecte Stripe/Hotmart.");
                        return;
                      }
                      activate("monthly");
                      route_10c.go("#/");
                    }}
                    className="mt-3 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold text-white/90 hover:bg-white/15 active:scale-[0.99] transition"
                  >
                    Assinar Mensal
                  </button>
                </div>

                <div className="rounded-2xl border border-[#0095FF]/30 bg-[#0095FF]/10 p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-white/95">Anual (12 meses)</div>
                    <div className="text-sm text-white/90">{fmtBRL(anual)}</div>
                  </div>
                  <div className="mt-1 text-xs text-white/70">Equivale a {fmtBRL(mensalEqAnual)}/mês.</div>
                  <button
                    type="button"
                    onClick={() => {
                      if (mode_10c === "checkout") {
                        alert("Checkout real ainda não conectado. (Sprint 10D)\nPor enquanto, troque o modo para Local ou conecte Stripe/Hotmart.");
                        return;
                      }
                      activate("annual");
                      route_10c.go("#/");
                    }}
                    className="mt-3 w-full rounded-2xl border border-[#0095FF]/30 bg-[#0095FF]/15 px-4 py-3 text-sm font-semibold text-white hover:bg-[#0095FF]/20 active:scale-[0.99] transition"
                  >
                    Assinar Anual
                  </button>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="text-xs text-white/60">Modo atual</div>
                <div className="mt-1 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setMode_10c("local")}
                    className={`rounded-2xl border px-3 py-2 text-xs transition ${mode_10c === "local" ? "border-white/20 bg-white/15 text-white" : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"}`}
                  >
                    Local (simulado)
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode_10c("checkout")}
                    className={`rounded-2xl border px-3 py-2 text-xs transition ${mode_10c === "checkout" ? "border-[#0095FF]/40 bg-[#0095FF]/15 text-white" : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"}`}
                  >
                    Checkout (pronto p/ integrar)
                  </button>
                </div>
                <div className="mt-2 text-[12px] text-white/50">
                  Checkout = somente “gancho” preparado (sem gateway ainda). Local = ativa no device.
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="text-[12px] uppercase tracking-wider text-white/50">Informações</div>
              <div className="mt-3 rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="text-sm font-semibold text-white/90">O que está incluso</div>
                <ul className="mt-2 space-y-2 text-sm text-white/75">
                  <li>• Dashboard PRO + Histórico de relatórios</li>
                  <li>• Export/Import + Backup/Restore</li>
                  <li>• PDF Premium (Coach/Paciente)</li>
                  <li>• Insights e tendências do histórico</li>
                </ul>
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="text-sm font-semibold text-white/90">Status atual</div>
                <div className="mt-2 text-sm text-white/75">
                  {sub ? (
                    <>Encontrado no dispositivo, porém <b>inativo/expirado</b>. Expira/expirou em: {expText}</>
                  ) : (
                    <>Nenhuma assinatura ativa encontrada neste dispositivo.</>
                  )}
                </div>
              </div>

              <div className="mt-4 text-[12px] text-white/50">
                Próximo sprint (10D): conectar Stripe/Hotmart/Kirvano e validar retorno com query/hash.
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => route_10c.go("#/assinatura")}
              className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-xs text-white/85 hover:bg-white/15 active:scale-[0.99] transition"
            >
              Ver detalhes da assinatura
            </button>
            <div className="text-[12px] text-white/45">
              Modo: <b>{mode_10c === "checkout" ? "Checkout" : "Local"}</b>
            </div>
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
