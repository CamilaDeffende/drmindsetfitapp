// MF_ONBOARDING_CONTRACT_V1
// PREMIUM_REFINEMENT_PHASE3_STEP6_UI_V4
// WEEKLY_DAYS_BY_MODALITY_V3
// STEP6_FIX_RENDER_LOOP_V1

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useOnboardingDraftSaver } from "@/store/onboarding/useOnboardingDraftSaver";
import { ChevronLeft, ChevronRight, Check, CalendarDays } from "lucide-react";

export type WeeklyDaysByModality = {
  [modalityId: string]: string[];
};

type Step6Value = {
  days?: string[];
  weeklyDaysByModality?: WeeklyDaysByModality;
};

type Props = {
  value?: Step6Value;
  onChange?: (v: Step6Value) => void;
  onNext?: () => void;
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

const MODALITY_LABELS: Record<string, string> = {
  musculacao: "Musculação",
  corrida: "Corrida",
  bike: "Bike",
  funcional: "Funcional",
  cross: "Cross",
};

function loadDraftStep5() {
  try {
    const raw = localStorage.getItem("mf:onboarding:draft:v1");
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed?.step5 ?? {};
  } catch {
    return {};
  }
}

function getSelectedModalities(step5: any): string[] {
  if (!Array.isArray(step5?.selected)) return [];
  return Array.from(
    new Set(
      step5.selected.filter(
        (item: unknown) => typeof item === "string" && item.trim().length > 0
      )
    )
  );
}

function normalizeGroupedDays(
  modalities: string[],
  incoming?: WeeklyDaysByModality
): WeeklyDaysByModality {
  const safeIncoming = incoming ?? {};
  const normalized: WeeklyDaysByModality = {};

  for (const modalityId of modalities) {
    const arr = Array.isArray(safeIncoming[modalityId]) ? safeIncoming[modalityId] : [];
    normalized[modalityId] = Array.from(new Set(arr));
  }

  return normalized;
}

function flattenUniqueDays(grouped: WeeklyDaysByModality) {
  return Array.from(new Set(Object.values(grouped).flat().filter(Boolean)));
}

function groupedDaysEqual(a: WeeklyDaysByModality, b: WeeklyDaysByModality) {
  const aKeys = Object.keys(a).sort();
  const bKeys = Object.keys(b).sort();

  if (aKeys.length !== bKeys.length) return false;
  for (let i = 0; i < aKeys.length; i++) {
    if (aKeys[i] !== bKeys[i]) return false;
    const arrA = [...(a[aKeys[i]] ?? [])].sort();
    const arrB = [...(b[bKeys[i]] ?? [])].sort();
    if (arrA.length !== arrB.length) return false;
    for (let j = 0; j < arrA.length; j++) {
      if (arrA[j] !== arrB[j]) return false;
    }
  }
  return true;
}

export default function Step6DiasSemana({
  value,
  onChange,
  onNext,
  onBack,
}: Props) {
  const step5Draft = useMemo(() => loadDraftStep5(), []);
  const selectedModalities = useMemo(() => getSelectedModalities(step5Draft), [step5Draft]);

  const initialGrouped = useMemo(
    () => normalizeGroupedDays(selectedModalities, value?.weeklyDaysByModality),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const [groupedDays, setGroupedDays] = useState<WeeklyDaysByModality>(initialGrouped);

  const prevModalitiesRef = useRef<string[]>(selectedModalities);
  const lastEmittedRef = useRef<string>("");

  // Só ressincroniza quando a lista de modalidades mudar de verdade
  useEffect(() => {
    const prev = prevModalitiesRef.current;
    const same =
      prev.length === selectedModalities.length &&
      prev.every((item, idx) => item === selectedModalities[idx]);

    if (same) return;

    prevModalitiesRef.current = selectedModalities;

    setGroupedDays((prevState) => {
      const next = normalizeGroupedDays(selectedModalities, prevState);
      return groupedDaysEqual(prevState, next) ? prevState : next;
    });
  }, [selectedModalities]);

  const emitChange = (nextGrouped: WeeklyDaysByModality) => {
    const normalized = normalizeGroupedDays(selectedModalities, nextGrouped);
    const payload: Step6Value = {
      days: flattenUniqueDays(normalized),
      weeklyDaysByModality: normalized,
    };

    const serialized = JSON.stringify(payload);
    if (lastEmittedRef.current === serialized) return;

    lastEmittedRef.current = serialized;
    onChange?.(payload);
  };

  useEffect(() => {
    emitChange(groupedDays);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupedDays, selectedModalities]);

  useOnboardingDraftSaver(
    {
      step6: {
        days: flattenUniqueDays(groupedDays),
        weeklyDaysByModality: groupedDays,
      },
      step6DiasSemana: {
        days: flattenUniqueDays(groupedDays),
        weeklyDaysByModality: groupedDays,
      },
    } as any,
    400
  );

  const toggleDay = (modalityId: string, dayKey: string) => {
    setGroupedDays((prev) => {
      const currentDays = Array.isArray(prev[modalityId]) ? prev[modalityId] : [];
      const exists = currentDays.includes(dayKey);

      return {
        ...prev,
        [modalityId]: exists
          ? currentDays.filter((day) => day !== dayKey)
          : [...currentDays, dayKey],
      };
    });
  };

  const groupedSummary = useMemo(() => {
    return selectedModalities.map((modalityId) => ({
      modalityId,
      label: MODALITY_LABELS[modalityId] ?? modalityId,
      days: groupedDays[modalityId] ?? [],
    }));
  }, [selectedModalities, groupedDays]);

  const canContinue =
    selectedModalities.length > 0 &&
    selectedModalities.every((modalityId) => {
      const days = groupedDays[modalityId] ?? [];
      return days.length > 0;
    });

  return (
    <div className="w-full text-white" data-testid="mf-step-root">
      <div className="space-y-6">
        <section className="rounded-[24px] border border-white/10 bg-[rgba(8,10,18,0.82)] p-4 sm:p-5 shadow-[0_0_32px_rgba(0,149,255,0.06)]">
          <div className="mb-2">
            <h3 className="text-[22px] font-semibold tracking-tight text-white">
              Dias por modalidade
            </h3>
            <p className="mt-1 text-[13px] leading-5 text-white/48">
              Defina os dias da semana para cada modalidade selecionada no passo anterior.
            </p>
          </div>

          <div className="mt-4 rounded-[20px] border border-white/10 bg-[linear-gradient(180deg,rgba(20,30,56,0.55),rgba(8,10,18,0.9))] p-4">
            <div className="text-[12px] uppercase tracking-[0.18em] text-white/35">
              Organização semanal
            </div>
            <p className="mt-2 text-[14px] leading-6 text-white/72">
              Cada modalidade recebe sua própria distribuição semanal para montar
              um plano mais inteligente e sustentável.
            </p>
          </div>
        </section>

        {selectedModalities.length === 0 ? (
          <section className="rounded-[24px] border border-amber-400/20 bg-amber-400/10 p-4 sm:p-5">
            <div className="text-[15px] font-semibold text-amber-200">
              Nenhuma modalidade selecionada
            </div>
            <p className="mt-2 text-[13px] leading-5 text-amber-100/80">
              Volte para o passo anterior e selecione pelo menos uma modalidade.
            </p>
          </section>
        ) : null}

        {selectedModalities.map((modalityId) => {
          const label = MODALITY_LABELS[modalityId] ?? modalityId;
          const activeDays = groupedDays[modalityId] ?? [];

          return (
            <section
              key={modalityId}
              className="rounded-[24px] border border-white/10 bg-[rgba(8,10,18,0.82)] p-4 sm:p-5 shadow-[0_0_32px_rgba(0,149,255,0.06)]"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-[20px] font-semibold tracking-tight text-white">
                    {label}
                  </h3>
                  <p className="mt-1 text-[13px] leading-5 text-white/48">
                    Selecione os dias em que essa modalidade deve acontecer.
                  </p>
                </div>

                <div className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] text-cyan-300">
                  {activeDays.length} dia(s)
                </div>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-7 gap-3">
                {DAYS.map((day) => {
                  const active = activeDays.includes(day.key);

                  return (
                    <button
                      key={`${modalityId}-${day.key}`}
                      type="button"
                      onClick={() => toggleDay(modalityId, day.key)}
                      className={[
                        "group relative overflow-hidden rounded-[20px] border px-3 py-5 text-center transition-all duration-200",
                        active
                          ? "border-cyan-400/35 bg-cyan-400/10 shadow-[0_0_24px_rgba(0,183,255,0.12)]"
                          : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/20",
                      ].join(" ")}
                    >
                      <div
                        className={[
                          "pointer-events-none absolute inset-0 transition-opacity duration-200",
                          active
                            ? "bg-gradient-to-br from-[#1E6BFF]/12 via-[#00B7FF]/8 to-transparent"
                            : "bg-transparent",
                        ].join(" ")}
                      />

                      <div className="relative flex flex-col items-center justify-center gap-2">
                        <div
                          className={[
                            "flex h-6 w-6 items-center justify-center rounded-full border transition-all duration-200",
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

              {activeDays.length === 0 ? (
                <div className="mt-4 rounded-[16px] border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-[12px] text-amber-100/85">
                  Selecione pelo menos 1 dia para {label.toLowerCase()}.
                </div>
              ) : null}
            </section>
          );
        })}

        <section className="rounded-[24px] border border-white/10 bg-[rgba(8,10,18,0.82)] p-4 sm:p-5 shadow-[0_0_32px_rgba(0,149,255,0.06)]">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-cyan-300" />
            <div className="text-[12px] uppercase tracking-[0.18em] text-white/35">
              Resumo semanal
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {groupedSummary.map((item) => (
              <div
                key={item.modalityId}
                className="rounded-[18px] border border-white/10 bg-black/20 px-4 py-3"
              >
                <div className="text-[14px] font-semibold text-white">{item.label}</div>
                <div className="mt-1 text-[13px] text-white/55">
                  {item.days.length > 0
                    ? item.days.map((day) => day.toUpperCase()).join(" • ")
                    : "Nenhum dia selecionado ainda"}
                </div>
              </div>
            ))}
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