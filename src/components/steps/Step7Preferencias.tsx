// MF_ONBOARDING_CONTRACT_V1
// PREMIUM_REFINEMENT_PHASE3_STEP7_UI_V1
// MF_BLOCK2_1_STEP7PREF_AUTOSAVE

import { Button } from "@/components/ui/button";
import { useOnboardingDraftSaver } from "@/store/onboarding/useOnboardingDraftSaver";
import { ChevronLeft, ChevronRight, Check, Leaf, Utensils, Apple } from "lucide-react";

type Props = {
  value: { dieta: string };
  onChange: (v: Props["value"]) => void;
  onNext: () => void;
  onBack?: () => void;
};

const options = [
  {
    k: "flexivel",
    label: "Flexível",
    desc: "Aderência acima de tudo, com mais liberdade para encaixar a rotina.",
    icon: Utensils,
    glow: "from-cyan-500/20 via-blue-500/10 to-transparent",
  },
  {
    k: "onivoro",
    label: "Onívoro",
    desc: "Estrutura alimentar completa, com variedade e praticidade.",
    icon: Apple,
    glow: "from-blue-500/20 via-cyan-500/10 to-transparent",
  },
  {
    k: "vegetariano",
    label: "Vegetariano",
    desc: "Sem carnes, com distribuição estratégica para proteína e saciedade.",
    icon: Leaf,
    glow: "from-emerald-500/20 via-lime-500/10 to-transparent",
  },
  {
    k: "vegano",
    label: "Vegano",
    desc: "100% vegetal, com foco em equilíbrio nutricional e consistência.",
    icon: Leaf,
    glow: "from-green-500/20 via-emerald-500/10 to-transparent",
  },
  {
    k: "lowcarb",
    label: "Low carb",
    desc: "Carboidrato mais controlado, com foco em aderência e performance.",
    icon: Utensils,
    glow: "from-violet-500/20 via-fuchsia-500/10 to-transparent",
  },
] as const;

export default function Step7Preferencias({
  value,
  onChange,
  onNext,
  onBack,
}: Props) {
  useOnboardingDraftSaver({ step7: value, step7Preferencias: value } as any, 400);

  const current = value?.dieta || "flexivel";
  const canContinue = Boolean(current);

  return (
    <div className="w-full text-white" data-testid="mf-step-root">
      <div className="space-y-6">
        {/* HERO */}
        <section className="rounded-[24px] border border-white/10 bg-[rgba(8,10,18,0.82)] p-4 sm:p-5 shadow-[0_0_32px_rgba(0,149,255,0.06)]">
          <div className="mb-2">
            <h3 className="text-[22px] font-semibold tracking-tight text-white">
              Preferências alimentares
            </h3>
            <p className="mt-1 text-[13px] leading-5 text-white/48">
              Ajuste o estilo alimentar do plano para ficar coerente com sua rotina.
            </p>
          </div>

          <div className="mt-4 rounded-[20px] border border-white/10 bg-[linear-gradient(180deg,rgba(20,30,56,0.55),rgba(8,10,18,0.9))] p-4">
            <div className="text-[12px] uppercase tracking-[0.18em] text-white/35">
              Aderência inteligente
            </div>
            <p className="mt-2 text-[14px] leading-6 text-white/72">
              O melhor plano não é o mais radical — é o que você consegue sustentar.
            </p>
          </div>
        </section>

        {/* CARDS */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {options.map((item) => {
            const active = current === item.k;
            const Icon = item.icon;

            return (
              <button
                key={item.k}
                type="button"
                onClick={() => onChange({ dieta: item.k })}
                className={[
                  "relative overflow-hidden rounded-[24px] border p-4 sm:p-5 text-left transition-all",
                  active
                    ? "border-emerald-400/40 bg-white/[0.04] shadow-[0_0_28px_rgba(34,197,94,0.10)]"
                    : "border-white/10 bg-[rgba(8,10,18,0.82)] hover:bg-white/[0.05] shadow-[0_0_32px_rgba(0,149,255,0.04)]",
                ].join(" ")}
              >
                <div
                  className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${item.glow}`}
                />

                <div className="relative">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-[16px] border border-white/10 bg-black/20 text-cyan-300">
                      <Icon className="h-5 w-5" />
                    </div>

                    <div
                      className={[
                        "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                        active
                          ? "border-emerald-400 bg-emerald-400 text-black"
                          : "border-white/20 bg-transparent text-transparent",
                      ].join(" ")}
                    >
                      <Check className="h-3 w-3" />
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="text-[18px] font-semibold tracking-tight text-white">
                      {item.label}
                    </div>
                    <p className="mt-2 text-[13px] leading-5 text-white/50">
                      {item.desc}
                    </p>
                  </div>

                  {active && (
                    <div className="mt-4 inline-flex items-center rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[11px] text-emerald-300">
                      Selecionada para o plano
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </section>

        {/* RESUMO */}
        <section className="rounded-[24px] border border-white/10 bg-[rgba(8,10,18,0.82)] p-4 sm:p-5 shadow-[0_0_32px_rgba(0,149,255,0.06)]">
          <div className="text-[12px] uppercase tracking-[0.18em] text-white/35">
            Preferência atual
          </div>

          <div className="mt-3 rounded-[20px] border border-white/10 bg-black/20 p-4">
            <div className="text-[14px] font-semibold text-white">
              {options.find((o) => o.k === current)?.label ?? "Flexível"}
            </div>

            <p className="mt-2 text-[13px] leading-5 text-white/48">
              {options.find((o) => o.k === current)?.desc ??
                "Aderência acima de tudo, com mais liberdade para encaixar a rotina."}
            </p>
          </div>
        </section>

        {/* CTA */}
        <div className="pt-1 flex gap-3">
          {onBack && (
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              className="h-14 w-[120px] rounded-[20px] border border-white/15 bg-black/20 text-white hover:bg-white/5"
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Voltar
            </Button>
          )}

          <Button
            type="button"
            disabled={!canContinue}
            onClick={onNext}
            variant="ghost"
            className="h-14 flex-1 overflow-hidden rounded-[20px] border-0 bg-gradient-to-r from-[#193B72] via-[#255AA8] to-[#7FE9D6] text-[15px] font-semibold text-white shadow-[0_10px_30px_rgba(0,149,255,0.18)] transition-all hover:brightness-110 hover:bg-transparent disabled:opacity-50"
          >
            Continuar
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}