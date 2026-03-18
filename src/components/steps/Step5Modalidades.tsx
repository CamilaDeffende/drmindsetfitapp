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
  ShieldCheck,
} from "lucide-react";

type Step5Value = {
  primary: string | null;
  secondary?: string | null;
  level?: string | null;
  selected?: string[];
};

type Props = {
  value?: Step5Value;
  onChange?: (v: Step5Value) => void;
  onNext?: () => void;
  onBack?: () => void;
};

const LEVELS = [
  {
    key: "iniciante",
    label: "Iniciante",
    desc: "Base técnica, adaptação e constância.",
  },
  {
    key: "intermediario",
    label: "Intermediário",
    desc: "Mais volume, progressão e organização.",
  },
  {
    key: "avancado",
    label: "Avançado",
    desc: "Maior tolerância a intensidade e especialização.",
  },
] as const;

export default function Step5Modalidades({
  value,
  onChange,
  onNext,
  onBack,
}: Props) {
  const safeValue: Step5Value = {
    primary: value?.primary ?? null,
    secondary: value?.secondary ?? null,
    level: value?.level ?? null,
    selected: Array.isArray(value?.selected)
      ? value!.selected
      : value?.primary
      ? [value.primary]
      : [],
  };

  const safeOnChange = onChange ?? (() => {});

  useOnboardingDraftSaver({ step5Modalidades: safeValue } as any, 400);

  const options = useMemo(
    () => [
      {
        key: "musculacao",
        label: "Musculação",
        desc: "Composição corporal, força e evolução estrutural.",
        icon: Dumbbell,
        glow: "from-[#1E6BFF]/20 via-[#00B7FF]/10 to-transparent",
      },
      {
        key: "corrida",
        label: "Corrida",
        desc: "Condicionamento, resistência e performance cardiovascular.",
        icon: PersonStanding,
        glow: "from-cyan-500/20 via-blue-500/10 to-transparent",
      },
      {
        key: "bike",
        label: "Bike",
        desc: "Volume aeróbico com menor impacto articular.",
        icon: Bike,
        glow: "from-sky-500/20 via-cyan-500/10 to-transparent",
      },
      {
        key: "funcional",
        label: "Funcional",
        desc: "Mobilidade, movimento e preparo global.",
        icon: Flame,
        glow: "from-violet-500/20 via-fuchsia-500/10 to-transparent",
      },
      {
        key: "cross",
        label: "Cross",
        desc: "Alta intensidade, potência e preparo físico.",
        icon: Flame,
        glow: "from-emerald-500/20 via-lime-500/10 to-transparent",
      },
    ],
    []
  );

  const selectedSet = new Set(safeValue.selected ?? []);

  const toggleSelection = (key: string) => {
    const current = new Set(safeValue.selected ?? []);

    if (current.has(key)) {
      current.delete(key);

      const nextSelected = Array.from(current);
      const nextPrimary =
        safeValue.primary === key ? nextSelected[0] ?? null : safeValue.primary;

      safeOnChange({
        ...safeValue,
        selected: nextSelected,
        primary: nextPrimary,
      });

      return;
    }

    current.add(key);
    const nextSelected = Array.from(current);

    safeOnChange({
      ...safeValue,
      selected: nextSelected,
      primary: safeValue.primary ?? key,
    });
  };

  const selectPrimary = (key: string) => {
    const current = new Set(safeValue.selected ?? []);
    current.add(key);

    safeOnChange({
      ...safeValue,
      selected: Array.from(current),
      primary: key,
    });
  };

  const handleSelectLevel = (level: string) => {
    safeOnChange({
      ...safeValue,
      level,
    });
  };

  const selectedOptions = options.filter((o) => selectedSet.has(o.key));

  const selectedPrimaryLabel =
    options.find((o) => o.key === safeValue.primary)?.label ?? "Nenhuma principal definida";

  const selectedLabels = selectedOptions.map((o) => o.label);

  const selectedLevelLabel =
    LEVELS.find((l) => l.key === safeValue.level)?.label ?? "Nível ainda não definido";

  const canContinue =
    Boolean((safeValue.selected?.length ?? 0) > 0) && Boolean(safeValue.level);

  return (
    <div className="w-full text-white" data-testid="mf-step-root">
      <div className="space-y-6">
        <section className="rounded-[24px] border border-white/10 bg-[rgba(8,10,18,0.82)] p-4 sm:p-5 shadow-[0_0_32px_rgba(0,149,255,0.06)]">
          <div className="mb-2">
            <h3 className="text-[22px] font-semibold tracking-tight text-white">
              Modalidades do protocolo
            </h3>
            <p className="mt-1 text-[13px] leading-5 text-white/48">
              Você pode escolher mais de uma modalidade e definir a principal.
            </p>
          </div>

          <div className="mt-4 rounded-[20px] border border-white/10 bg-[linear-gradient(180deg,rgba(20,30,56,0.55),rgba(8,10,18,0.9))] p-4">
            <div className="text-[12px] uppercase tracking-[0.18em] text-white/35">
              Direcionamento premium
            </div>
            <p className="mt-2 text-[14px] leading-6 text-white/72">
              O app usa essa seleção para montar uma base mais inteligente do seu treino,
              inclusive em estratégias híbridas como musculação + corrida ou musculação + bike.
            </p>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-4">
          {options.map((item) => {
            const selected = selectedSet.has(item.key);
            const isPrimary = safeValue.primary === item.key;
            const Icon = item.icon;

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => toggleSelection(item.key)}
                className={[
                  "relative overflow-hidden rounded-[20px] border text-left transition-all",
                  "p-3 sm:p-4",
                  selected
                    ? "border-cyan-400/35 bg-white/[0.04] shadow-[0_0_18px_rgba(0,183,255,0.10)]"
                    : "border-white/10 bg-[rgba(8,10,18,0.82)] hover:bg-white/[0.05]",
                ].join(" ")}
              >
                <div
                  className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${item.glow}`}
                />

                <div className="relative">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-[12px] border border-white/10 bg-black/20 text-cyan-300">
                      <Icon className="h-4 w-4" />
                    </div>

                    <div
                      className={[
                        "flex h-5 w-5 items-center justify-center rounded-full border",
                        selected
                          ? "border-emerald-400 bg-emerald-400 text-black"
                          : "border-white/20 bg-transparent",
                      ].join(" ")}
                    >
                      {selected ? <span className="text-[11px] font-bold">✓</span> : null}
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="text-[15px] font-semibold text-white">
                      {item.label}
                    </div>

                    <p className="mt-1 text-[12px] leading-5 text-white/50">
                      {item.desc}
                    </p>
                  </div>

                  {selected ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        selectPrimary(item.key);
                      }}
                      className={[
                        "mt-3 inline-flex items-center rounded-full px-2 py-1 text-[10px] transition-all",
                        isPrimary
                          ? "border border-cyan-400/20 bg-cyan-400/15 text-cyan-300"
                          : "border border-white/10 bg-white/5 text-white/60 hover:bg-white/10",
                      ].join(" ")}
                    >
                      {isPrimary ? "Principal" : "Definir"}
                    </button>
                  ) : null}
                </div>
              </button>
            );
          })}
        </section>

        <section className="rounded-[24px] border border-white/10 bg-[rgba(8,10,18,0.82)] p-4 sm:p-5 shadow-[0_0_32px_rgba(0,149,255,0.06)]">
          <div className="mb-2">
            <h3 className="text-[22px] font-semibold tracking-tight text-white">
              Nível de treino
            </h3>
            <p className="mt-1 text-[13px] leading-5 text-white/48">
              Isso ajuda o app a ajustar progressão, volume e complexidade.
            </p>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3">
            {LEVELS.map((level) => {
              const active = safeValue.level === level.key;

              return (
                <button
                  key={level.key}
                  type="button"
                  onClick={() => handleSelectLevel(level.key)}
                  className={[
                    "rounded-[20px] border p-4 text-left transition-all",
                    active
                      ? "border-cyan-400/35 bg-cyan-400/10 shadow-[0_0_24px_rgba(0,183,255,0.12)]"
                      : "border-white/10 bg-black/20 hover:bg-white/[0.04] hover:border-white/20",
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[16px] font-semibold text-white">
                        {level.label}
                      </div>
                      <div className="mt-1 text-[13px] leading-5 text-white/48">
                        {level.desc}
                      </div>
                    </div>

                    <div
                      className={[
                        "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                        active
                          ? "border-emerald-400 bg-emerald-400 text-black"
                          : "border-white/20 bg-transparent",
                      ].join(" ")}
                    >
                      {active ? <span className="text-[11px] font-bold">✓</span> : null}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-[24px] border border-white/10 bg-[rgba(8,10,18,0.82)] p-4 sm:p-5 shadow-[0_0_32px_rgba(0,149,255,0.06)]">
          <div className="text-[12px] uppercase tracking-[0.18em] text-white/35">
            Preview do foco
          </div>

          <div className="mt-3 rounded-[20px] border border-white/10 bg-black/20 p-4">
            <div className="flex items-center gap-2 text-[13px] font-medium text-cyan-300">
              <ShieldCheck className="h-4 w-4" />
              Estrutura prevista
            </div>

            <div className="mt-3 text-[16px] font-semibold text-white">
              Modalidade principal: {selectedPrimaryLabel}
            </div>

            <div className="mt-2 text-[13px] leading-5 text-white/48">
              {selectedLabels.length > 0
                ? `Selecionadas: ${selectedLabels.join(" • ")}`
                : "Selecione uma ou mais modalidades para o app estruturar sua base de treino."}
            </div>

            <div className="mt-4 rounded-[16px] border border-white/10 bg-white/[0.03] px-4 py-3 text-[13px] text-white/72">
              Nível selecionado:{" "}
              <span className="font-semibold text-white">{selectedLevelLabel}</span>
            </div>
          </div>
        </section>

        <div className="pt-1 flex gap-3">
          {onBack ? (
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              className="h-14 w-[120px] rounded-[20px] border border-white/15 bg-black/20 text-white hover:bg-white/5"
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Voltar
            </Button>
          ) : null}

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
