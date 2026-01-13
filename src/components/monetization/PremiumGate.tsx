import React from "react";
import { loadFlags } from "@/lib/featureFlags";

type Props = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

export function PremiumGate({ children, fallback }: Props) {
  const flags = typeof window !== "undefined" ? loadFlags() : { paywallEnabled: false, premiumUnlocked: false };

  // paywall desligado => libera tudo
  if (!flags.paywallEnabled) return <>{children}</>;

  // paywall ligado e premium liberado => libera
  if (flags.premiumUnlocked) return <>{children}</>;

  // fallback padrão (discreto, premium)
  return (
    <>
      {fallback ?? (
        <div className="rounded-2xl border border-white/10 bg-black/40 p-4 text-white">
          <div className="text-[14px] font-semibold">Conteúdo Premium</div>
          <div className="mt-1 text-[12px] text-white/70">
            Desbloqueie para acessar este recurso. (Modo preparado para monetização — sem login.)
          </div>
        </div>
      )}
    </>
  );
}
