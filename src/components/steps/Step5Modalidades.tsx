// MF_ONBOARDING_CONTRACT_V1
// PREMIUM_REFINEMENT_PHASE3_STEP5_UI_V1
// MF_BLOCK2_1_STEP5MOD_AUTOSAVE

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useOnboardingDraftSaver } from "@/store/onboarding/useOnboardingDraftSaver";
import {
  Dumbbell,
  Bike,
  PersonStanding,
  Flame,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

type Step5Value = {
  primary: string | null;
  secondary?: string | null;
};

type Props = {
  value?: Step5Value;
  onChange?: (v: Step5Value) => void;
  onNext?: () => void;
  onBack?: () => void;
};

export default function Step5Modalidades({
  value,
  onChange,
  onNext,
  onBack,
}: Props) {
  const safeValue: Step5Value = {
    primary: value?.primary ?? null,
    secondary: value?.secondary ?? null,
  };

  const safeOnChange = onChange ?? (() => {});

  useOnboardingDraftSaver({ step5Modalidades: safeValue } as any, 400);

  const options = useMemo(
    () => [
      {
        key: "musculacao",
        label: "Musculação",
        desc: "Base ideal para composição corporal, força e evolução estrutural.",
        icon: Dumbbell,
        glow: "from-[#1E6BFF]/20 via-[#00B7FF]/10 to-transparent",
      },
      {
        key: "corrida",
        label: "Corrida",
        desc: "Melhora condicionamento, resistência e performance cardiovascular.",
        icon: PersonStanding,
        glow: "from-cyan-500/20 via-blue-500/10 to-transparent",
      },
      {
        key: "bike",
        label: "Bike",
        desc: "Excelente para volume aeróbico com menor impacto articular.",
        icon: Bike,
        glow: "from-sky-500/20 via-cyan-500/10 to-transparent",
      },
      {
        key: "funcional",
        label: "Funcional",
        desc: "Movimento, mobilidade e condicionamento com foco global.",
        icon: Flame,
        glow: "from-violet-500/20 via-fuchsia-500/10 to-transparent",
      },
      {
        key: "cross",
        label: "Cross",
        desc: "Alta intensidade, potência e preparo físico completo.",
        icon: Flame,
        glow: "from-emerald-500/20 via-lime-500/10 to-transparent",
      },
    ],
    []
  );

  const handleSelectPrimary = (key: string) => {
    safeOnChange({
      ...safeValue,
      primary: key,
    });
  };

  const canContinue = Boolean(safeValue.primary);

  return (
    <div className="w-full text-white" data-testid="mf-step-root">
      <div className="space-y-6">
        {/* HERO */}
        <section className="rounded-[24px] border border-white/10 bg-[rgba(8,10,18,0.82)] p-4 sm:p-5 shadow-[0_0_32px_rgba(0,149,255,0.06)]">
          <div className="mb-2">
            <h3 className="text-[22px] font-semibold tracking-tight text-white">
              Modalidade principal
            </h3>
            <p className="mt-1 text-[13px] leading-5 text-white/48">
              Escolha o foco dominante do seu protocolo semanal.
            </p>
          </div>

          <div className="mt-4 rounded-[20px] border border-white/10 bg-[linear-gradient(180deg,rgba(20,30,56,0.55),rgba(8,10,18,0.9))] p-4">
            <div className="text-[12px] uppercase tracking-[0.18em] text-white/35">
              Direcionamento premium
            </div>
            <p className="mt-2 text-[14px] leading-6 text-white/72">
              Essa escolha orienta sua distribuição de treino, progressão de carga,
              foco cardiorrespiratório e lógica de recuperação.
            </p>
          </div>
        </section>

        {/* CARDS */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {options.map((item) => {
            const active = safeValue.primary === item.key;
            const Icon = item.icon;

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => handleSelectPrimary(item.key)}
                className={[
                  "relative overflow-hidden rounded-[24px] border p-4 sm:p-5 text-left transition-all",
                  active
                    ? "border-cyan-400/35 bg-white/[0.04] shadow-[0_0_28px_rgba(0,183,255,0.10)]"
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
                          : "border-white/20 bg-transparent",
                      ].join(" ")}
                    >
                      {active ? (
                        <span className="text-[11px] font-bold">✓</span>
                      ) : null}
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
                    <div className="mt-4 inline-flex items-center rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 text-[11px] text-cyan-300">
                      Selecionada como foco principal
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </section>

        {/* PREVIEW */}
        <section className="rounded-[24px] border border-white/10 bg-[rgba(8,10,18,0.82)] p-4 sm:p-5 shadow-[0_0_32px_rgba(0,149,255,0.06)]">
          <div className="text-[12px] uppercase tracking-[0.18em] text-white/35">
            Preview do foco
          </div>

          <div className="mt-3 rounded-[20px] border border-white/10 bg-black/20 p-4">
            <div className="text-[14px] font-semibold text-white">
              {safeValue.primary
                ? options.find((o) => o.key === safeValue.primary)?.label
                : "Nenhuma modalidade selecionada"}
            </div>

            <p className="mt-2 text-[13px] leading-5 text-white/48">
              {safeValue.primary
                ? options.find((o) => o.key === safeValue.primary)?.desc
                : "Selecione uma modalidade para o app estruturar a base do seu plano de treino."}
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
            className="h-14 flex-1 rounded-[20px] border border-cyan-300/20 bg-gradient-to-r from-[#193B72] via-[#255AA8] to-[#7FE9D6] text-[15px] font-semibold text-white shadow-[0_10px_30px_rgba(0,149,255,0.18)] transition-all hover:brightness-110 disabled:opacity-50"
          >
            Continuar
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}