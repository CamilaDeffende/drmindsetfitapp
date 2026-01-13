import { useMemo, useState  } from "react";
import { loadFlags, setFlag } from "@/lib/featureFlags";
import BrandIcon from "@/components/branding/BrandIcon";

export default function Assinatura() {
  const [flags, setFlags] = useState(() => (typeof window !== "undefined" ? loadFlags() : { paywallEnabled: false, premiumUnlocked: false }));
  const status = useMemo(() => (flags.paywallEnabled ? (flags.premiumUnlocked ? "Premium liberado" : "Bloqueado") : "Paywall desligado"), [flags]);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto w-full max-w-[520px] px-5 py-8">
        <div className="flex items-center gap-3">
          <BrandIcon />
          <div>
            <div className="text-[16px] font-semibold">Assinatura</div>
            <div className="text-[12px] text-white/70">{status}</div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-[14px] font-semibold">Modo de Monetização (sem login)</div>
          <div className="mt-1 text-[12px] text-white/70">
            Esta tela controla flags locais para simular o paywall — pronto para integrar checkout futuramente.
          </div>

          <div className="mt-4 flex flex-col gap-2">
            <button
              className="rounded-xl bg-white text-black px-4 py-3 text-[13px] font-semibold active:scale-[0.99]"
              onClick={() => setFlags(setFlag("paywallEnabled", !flags.paywallEnabled))}
            >
              {flags.paywallEnabled ? "Desligar Paywall" : "Ligar Paywall"}
            </button>

            <button
              className="rounded-xl border border-white/15 bg-transparent px-4 py-3 text-[13px] font-semibold text-white active:scale-[0.99]"
              onClick={() => setFlags(setFlag("premiumUnlocked", !flags.premiumUnlocked))}
              disabled={!flags.paywallEnabled}
              style={{ opacity: flags.paywallEnabled ? 1 : 0.5 }}
            >
              {flags.premiumUnlocked ? "Bloquear Premium" : "Liberar Premium"}
            </button>
          </div>
        </div>

        <div className="mt-5 text-[11px] text-white/50">
          Nota: flags são salvas em localStorage. Checkout real será integrado depois.
        </div>
      </div>
    </div>
  );
}
