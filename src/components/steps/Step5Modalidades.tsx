// MF_ONBOARDING_CONTRACT_V1
// PREMIUM_REFINEMENT_PHASE3_STEP5_UI_V3
// MF_BLOCK2_1_STEP5MOD_AUTOSAVE
// STEP5_MULTI_MODALITY_CLEAN_STATE_V1

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
  Check,
} from "lucide-react";

type Step5Value = {
  selected?: string[];
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

  const validKeys = useMemo(() => options.map((item) => item.key), [options]);

  const selected = useMemo(() => {
    const raw = Array.isArray(value?.selected) ? value!.selected : [];
    const filtered = raw.filter((item) => validKeys.includes(item));
    return Array.from(new Set(filtered));
  }, [value, validKeys]);

  const primary = useMemo(() => {
    if (value?.primary && selected.includes(value.primary)) return value.primary;
    return selected[0] ?? null;
  }, [value, selected]);

  const safeValue: Step5Value = {
    selected,
    primary,
    secondary: undefined,
  };

  const safeOnChange = onChange ?? (() => {});

  useOnboardingDraftSaver(
    {
      step5: safeValue,
    } as any,
    400
  );

  const emitValue = (nextSelected: string[], nextPrimary?: string | null) => {
    const normalizedSelected = Array.from(
      new Set(nextSelected.filter((item) => validKeys.includes(item)))
    );

    const normalizedPrimary =
      nextPrimary && normalizedSelected.includes(nextPrimary)
        ? nextPrimary
        : normalizedSelected[0] ?? null;

    safeOnChange({
      selected: normalizedSelected,
      primary: normalizedPrimary,
      secondary: undefined,
    });
  };

  const toggleModality = (key: string) => {
    if (selected.includes(key)) {
      const nextSelected = selected.filter((item) => item !== key);
      emitValue(nextSelected, primary === key ? nextSelected[0] ?? null : primary);
      return;
    }

    const nextSelected = [...selected, key];
    emitValue(nextSelected, primary ?? key);
  };

  const setAsPrimary = (key: string) => {
    if (!selected.includes(key)) return;
    emitValue(selected, key);
  };

  const canContinue = selected.length > 0 && Boolean(primary);

  return (
    <div className="w-full text-white" data-testid="mf-step-root">
      <div className="space-y-6">
        <section className="rounded-[24px] border border-white/10 bg-[rgba(8,10,18,0.82)] p-4 sm:p-5 shadow-[0_0_32px_rgba(0,149,255,0.06)]">
          <div className="mb-2">
            <h3 className="text-[22px] font-semibold tracking-tight text-white">
              Modalidades
            </h3>
            <p className="mt-1 text-[13px] leading-5 text-white/48">
              Selecione uma ou mais modalidades. No próximo passo você define os dias de cada uma.
            </p>
          </div>

          <div className="mt-4 rounded-[20px] border border-white/10 bg-[linear-gradient(180deg,rgba(20,30,56,0.55),rgba(8,10,18,0.9))] p-4">
            <div className="text-[12px] uppercase tracking-[0.18em] text-white/35">
              Direcionamento premium
            </div>
            <p className="mt-2 text-[14px] leading-6 text-white/72">
              O app pode combinar modalidades e distribuir cada uma em dias próprios,
              respeitando melhor sua rotina e recuperação.
            </p>
          </div>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {options.map((item) => {
            const active = selected.includes(item.key);
            const isPrimary = primary === item.key;
            const Icon = item.icon;

            return (
              <div
                key={item.key}
                className={[
                  "relative overflow-hidden rounded-[24px] border p-4 sm:p-5 transition-all",
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

                    <button
                      type="button"
                      onClick={() => toggleModality(item.key)}
                      className={[
                        "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-all",
                        active
                          ? "border-emerald-400 bg-emerald-400 text-black"
                          : "border-white/20 bg-transparent text-transparent",
                      ].join(" ")}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="mt-4">
                    <div className="text-[18px] font-semibold tracking-tight text-white">
                      {item.label}
                    </div>
                    <p className="mt-2 text-[13px] leading-5 text-white/50">
                      {item.desc}
                    </p>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => toggleModality(item.key)}
                      className={[
                        "rounded-full border px-3 py-1.5 text-[11px] transition-all",
                        active
                          ? "border-cyan-400/20 bg-cyan-400/10 text-cyan-300"
                          : "border-white/10 bg-black/20 text-white/65 hover:bg-white/[0.04]",
                      ].join(" ")}
                    >
                      {active ? "Selecionada" : "Selecionar"}
                    </button>

                    {active ? (
                      <button
                        type="button"
                        onClick={() => setAsPrimary(item.key)}
                        className={[
                          "rounded-full border px-3 py-1.5 text-[11px] transition-all",
                          isPrimary
                            ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                            : "border-white/10 bg-black/20 text-white/65 hover:bg-white/[0.04]",
                        ].join(" ")}
                      >
                        {isPrimary ? "Foco principal" : "Definir como principal"}
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        <section className="rounded-[24px] border border-white/10 bg-[rgba(8,10,18,0.82)] p-4 sm:p-5 shadow-[0_0_32px_rgba(0,149,255,0.06)]">
          <div className="text-[12px] uppercase tracking-[0.18em] text-white/35">
            Resumo das modalidades
          </div>

          <div className="mt-3 rounded-[20px] border border-white/10 bg-black/20 p-4">
            {selected.length > 0 ? (
              <div className="space-y-3">
                <div className="text-[14px] text-white/75">
                  {selected.length} modalidade(s) selecionada(s)
                </div>

                <div className="flex flex-wrap gap-2">
                  {selected.map((key) => {
                    const label = options.find((o) => o.key === key)?.label ?? key;
                    const isPrimary = primary === key;

                    return (
                      <div
                        key={key}
                        className={[
                          "rounded-full border px-3 py-1.5 text-[11px]",
                          isPrimary
                            ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                            : "border-white/10 bg-white/[0.03] text-white/70",
                        ].join(" ")}
                      >
                        {label}
                        {isPrimary ? " • principal" : ""}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="text-[13px] leading-5 text-white/48">
                Selecione pelo menos uma modalidade para continuar.
              </p>
            )}
          </div>
        </section>

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