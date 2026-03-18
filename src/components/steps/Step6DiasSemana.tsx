// MF_ONBOARDING_CONTRACT_V1
// PREMIUM_REFINEMENT_PHASE3_STEP6_UI_V1

import { Button } from "@/components/ui/button";
import { useOnboardingDraftSaver } from "@/store/onboarding/useOnboardingDraftSaver";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";

type Props = {
  value: { days: string[] };
  onChange: (v: Props["value"]) => void;
  onNext: () => void;
  onBack?: () => void;
};

const DAYS = [
  { key: "seg", label: "SEG" },
  { key: "ter", label: "TER" },
  { key: "qua", label: "QUA" },
  { key: "qui", label: "QUI" },
  { key: "sex", label: "SEX" },
  { key: "sab", label: "SAB" },
  { key: "dom", label: "DOM" },
] as const;

export default function Step6DiasSemana({
  value,
  onChange,
  onNext,
  onBack,
}: Props) {
  useOnboardingDraftSaver({ step6DiasSemana: value } as any, 400);

  const safeDays = value?.days ?? [];

  const toggle = (d: string) => {
    const set = new Set(safeDays);
    if (set.has(d)) {
      set.delete(d);
    } else {
      set.add(d);
    }
    onChange({ days: Array.from(set) });
  };

  const canContinue = safeDays.length > 0;

  return (
    <div className="w-full text-white" data-testid="mf-step-root">
      <div className="space-y-6">
        {/* HERO */}
        <section className="rounded-[24px] border border-white/10 bg-[rgba(8,10,18,0.82)] p-4 sm:p-5 shadow-[0_0_32px_rgba(0,149,255,0.06)]">
          <div className="mb-2">
            <h3 className="text-[22px] font-semibold tracking-tight text-white">
              Dias da semana
            </h3>
            <p className="mt-1 text-[13px] leading-5 text-white/48">
              Defina em quais dias seu protocolo será distribuído.
            </p>
          </div>

          <div className="mt-4 rounded-[20px] border border-white/10 bg-[linear-gradient(180deg,rgba(20,30,56,0.55),rgba(8,10,18,0.9))] p-4">
            <div className="text-[12px] uppercase tracking-[0.18em] text-white/35">
              Organização semanal
            </div>
            <p className="mt-2 text-[14px] leading-6 text-white/72">
              O app usa essa seleção para estruturar treinos, recuperação e
              ritmo de progressão ao longo da semana.
            </p>
          </div>
        </section>

        {/* CHIPS */}
        <section className="rounded-[24px] border border-white/10 bg-[rgba(8,10,18,0.82)] p-4 sm:p-5 shadow-[0_0_32px_rgba(0,149,255,0.06)]">
          <div className="mb-4">
            <h3 className="text-[22px] font-semibold tracking-tight text-white">
              Selecione seus dias
            </h3>
            <p className="mt-1 text-[13px] leading-5 text-white/48">
              Escolha apenas os dias que você consegue sustentar com constância.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {DAYS.map((day) => {
              const active = safeDays.includes(day.key);

              return (
                <button
                  key={day.key}
                  type="button"
                  onClick={() => toggle(day.key)}
                  className={[
                    "group relative overflow-hidden rounded-[20px] border px-3 py-5 text-center transition-all duration-300",
                    active
                      ? "border-cyan-400/35 bg-cyan-400/10 shadow-[0_0_24px_rgba(0,183,255,0.12)] scale-[1.02]"
                      : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/20 hover:scale-[1.01]",
                  ].join(" ")}
                >
                  <div
                    className={[
                      "pointer-events-none absolute inset-0 opacity-100 transition-opacity",
                      active
                        ? "bg-gradient-to-br from-[#1E6BFF]/12 via-[#00B7FF]/8 to-transparent"
                        : "bg-transparent",
                    ].join(" ")}
                  />

                  <div className="relative flex flex-col items-center justify-center gap-2">
                    <div
                      className={[
                        "flex h-6 w-6 items-center justify-center rounded-full border transition-all",
                        active
                          ? "border-emerald-400 bg-emerald-400 text-black"
                          : "border-white/20 bg-black/20 text-transparent",
                      ].join(" ")}
                    >
                      {active ? <Check className="h-3.5 w-3.5" /> : null}
                    </div>

                    <span
                      className={[
                        "text-[15px] font-semibold tracking-[0.08em]",
                        active ? "text-white" : "text-white/80",
                      ].join(" ")}
                    >
                      {day.label}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-5 rounded-[18px] border border-white/10 bg-black/20 px-4 py-3">
            <div className="text-[12px] uppercase tracking-[0.18em] text-white/35">
              Dias selecionados
            </div>
            <div className="mt-2 text-[14px] text-white/75">
              {safeDays.length > 0
                ? safeDays.map((d) => d.toUpperCase()).join(" • ")
                : "Nenhum dia selecionado ainda"}
            </div>
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