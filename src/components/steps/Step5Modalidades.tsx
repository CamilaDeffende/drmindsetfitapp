// MF_ONBOARDING_CONTRACT_V2
// PREMIUM_REFINEMENT_PHASE3_STEP5_UI_V4
// MF_BLOCK2_1_STEP5MOD_AUTOSAVE
// STEP5_MULTI_MODALITY_CLEAN_STATE_V2

import React, { useCallback, useEffect, useMemo } from "react";
import { useOnboardingDraftSaver } from "@/store/onboarding/useOnboardingDraftSaver";
import { Button } from "@/components/ui/button";
import {
  Dumbbell,
  Bike,
  PersonStanding,
  Flame,
  ChevronLeft,
  ChevronRight,
  Check,
} from "lucide-react";

type MF_Level = "iniciante" | "intermediario" | "avancado";

type Step5Value = {
  primary: string | null;
  secondary?: string | null;
  modalidades: string[];
  diasPorModalidade: Record<string, string[]>;
  condicionamentoPorModalidade: Record<string, MF_Level>;
};

type Props = {
  value?: Partial<Step5Value>;
  onChange?: (v: Step5Value) => void;
  onNext?: () => void;
  onBack?: () => void;
};

const LS_KEY = "mf_onboarding_draft";

const WEEK = [
  { key: "seg", label: "SEG" },
  { key: "ter", label: "TER" },
  { key: "qua", label: "QUA" },
  { key: "qui", label: "QUI" },
  { key: "sex", label: "SEX" },
  { key: "sab", label: "SAB" },
  { key: "dom", label: "DOM" },
] as const;

function readDraft(): any {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeDraft(patch: any) {
  try {
    const prev = readDraft();
    const next = { ...prev, ...patch };
    localStorage.setItem(LS_KEY, JSON.stringify(next));
  } catch {
    // noop
  }
}

function uniqStable(arr: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();

  for (const x of arr) {
    const k = String(x || "").trim();
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(k);
  }

  return out;
}

function normalizeLevel(v: any): MF_Level {
  const s = String(v || "").toLowerCase();
  if (s.includes("avan")) return "avancado";
  if (s.includes("inter")) return "intermediario";
  return "iniciante";
}

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
        desc: "Treino de força e hipertrofia com foco em evolução progressiva.",
        icon: Dumbbell,
        glow: "from-cyan-500/20 via-cyan-500/5 to-transparent",
      },
      {
        key: "corrida",
        label: "Corrida",
        desc: "Condicionamento, resistência e melhora cardiovascular.",
        icon: PersonStanding,
        glow: "from-emerald-500/20 via-emerald-500/5 to-transparent",
      },
      {
        key: "bike",
        label: "Bike",
        desc: "Cardio de baixo impacto com ótimo gasto calórico.",
        icon: Bike,
        glow: "from-sky-500/20 via-sky-500/5 to-transparent",
      },
      {
        key: "funcional",
        label: "Funcional",
        desc: "Movimentos integrados para mobilidade, força e resistência.",
        icon: Flame,
        glow: "from-orange-500/20 via-orange-500/5 to-transparent",
      },
      {
        key: "cross",
        label: "Cross",
        desc: "Treinos intensos com mistura de força, cardio e potência.",
        icon: Dumbbell,
        glow: "from-fuchsia-500/20 via-fuchsia-500/5 to-transparent",
      },
    ],
    []
  );

  const initial = useMemo<Step5Value>(() => {
    const draft = readDraft();

    const modalidadesFromDraft = uniqStable(
      (Array.isArray(draft?.modalidadesSelecionadas) ? draft.modalidadesSelecionadas : [])
        .map((x: any) => String(x || ""))
        .filter(Boolean)
    );

    const diasFromDraft =
      draft?.diasPorModalidade && typeof draft.diasPorModalidade === "object"
        ? (draft.diasPorModalidade as Record<string, string[]>)
        : {};

    const condFromDraftRaw =
      draft?.condicionamentoPorModalidade && typeof draft.condicionamentoPorModalidade === "object"
        ? (draft.condicionamentoPorModalidade as Record<string, any>)
        : {};

    const condFromDraft: Record<string, MF_Level> = {};
    for (const k of Object.keys(condFromDraftRaw)) {
      condFromDraft[k] = normalizeLevel(condFromDraftRaw[k]);
    }

    const modalidadesFromProps = uniqStable(
      (Array.isArray(value?.modalidades) ? (value?.modalidades as string[]) : [])
        .map((x) => String(x || ""))
        .filter(Boolean)
    );

    const modalidades = uniqStable([...modalidadesFromDraft, ...modalidadesFromProps]);

    const primary = (value?.primary ??
      draft?.step5Modalidades?.primary ??
      (modalidades[0] ?? null)) as string | null;

    const secondary = (value?.secondary ??
      draft?.step5Modalidades?.secondary ??
      (modalidades[1] ?? null)) as string | null;

    const diasPorModalidade: Record<string, string[]> = {
      ...diasFromDraft,
      ...(value?.diasPorModalidade ?? {}),
    } as any;

    const condicionamentoPorModalidade: Record<string, MF_Level> = {
      ...condFromDraft,
      ...(value?.condicionamentoPorModalidade ?? {}),
    } as any;

    for (const m of modalidades) {
      if (!condicionamentoPorModalidade[m]) condicionamentoPorModalidade[m] = "iniciante";
      if (!Array.isArray(diasPorModalidade[m])) diasPorModalidade[m] = [];
    }

    return {
      primary,
      secondary: secondary ?? null,
      modalidades,
      diasPorModalidade,
      condicionamentoPorModalidade,
    };
  }, [value]);

  const [state, setState] = React.useState<Step5Value>(initial);

  useEffect(() => {
    setState(initial);
  }, [initial]);

  const safeOnChange = onChange ?? (() => {});

  useEffect(() => {
    writeDraft({
      modalidadesSelecionadas: state.modalidades,
      diasPorModalidade: state.diasPorModalidade,
      condicionamentoPorModalidade: state.condicionamentoPorModalidade,
      step5Modalidades: {
        primary: state.primary,
        secondary: state.secondary ?? null,
        modalidades: state.modalidades.map((k) => ({ key: k })),
        diasPorModalidade: state.diasPorModalidade,
        condicionamentoPorModalidade: state.condicionamentoPorModalidade,
      },
    });

    safeOnChange(state);
  }, [state, safeOnChange]);

  useOnboardingDraftSaver({ step5Modalidades: state } as any, 400);

  const toggleModality = useCallback((key: string) => {
    setState((prev) => {
      const has = prev.modalidades.includes(key);
      const nextModalidades = has
        ? prev.modalidades.filter((m) => m !== key)
        : [...prev.modalidades, key];

      const modalidades = uniqStable(nextModalidades);
      const diasPorModalidade = { ...prev.diasPorModalidade };
      const condicionamentoPorModalidade = { ...prev.condicionamentoPorModalidade };

      if (!diasPorModalidade[key]) diasPorModalidade[key] = [];
      if (!condicionamentoPorModalidade[key]) condicionamentoPorModalidade[key] = "iniciante";

      if (has) {
        delete diasPorModalidade[key];
        delete condicionamentoPorModalidade[key];
      }

      const primary = modalidades[0] ?? null;
      const secondary = modalidades[1] ?? null;

      return {
        ...prev,
        modalidades,
        primary,
        secondary,
        diasPorModalidade,
        condicionamentoPorModalidade,
      };
    });
  }, []);

  const toggleDay = useCallback((mod: string, day: string) => {
    setState((prev) => {
      const cur = Array.isArray(prev.diasPorModalidade[mod]) ? prev.diasPorModalidade[mod] : [];
      const has = cur.includes(day);
      const next = has ? cur.filter((d) => d !== day) : [...cur, day];

      return {
        ...prev,
        diasPorModalidade: {
          ...prev.diasPorModalidade,
          [mod]: uniqStable(next),
        },
      };
    });
  }, []);

  const setLevel = useCallback((mod: string, level: MF_Level) => {
    setState((prev) => ({
      ...prev,
      condicionamentoPorModalidade: {
        ...prev.condicionamentoPorModalidade,
        [mod]: level,
      },
    }));
  }, []);

  const hasAny = state.modalidades.length > 0;

  return (
    <div className="w-full text-white" data-testid="mf-step-root">
      <div className="space-y-6">
        <section className="rounded-[24px] border border-white/10 bg-[rgba(8,10,18,0.82)] p-4 sm:p-5 shadow-[0_0_32px_rgba(0,149,255,0.06)]">
          <div className="mb-2">
            <h3 className="text-[22px] font-semibold tracking-tight text-white">
              Modalidades
            </h3>
            <p className="mt-1 text-[13px] leading-5 text-white/48">
              Selecione uma ou mais modalidades e configure os dias e o nível de cada uma.
            </p>
          </div>

          <div className="mt-4 rounded-[20px] border border-white/10 bg-[linear-gradient(180deg,rgba(20,30,56,0.55),rgba(8,10,18,0.9))] p-4">
            <div className="text-[12px] uppercase tracking-[0.18em] text-white/35">
              Direcionamento premium
            </div>
            <p className="mt-2 text-[14px] leading-6 text-white/72">
              O app pode combinar modalidades e distribuir cada uma em dias próprios,
              respeitando melhor sua rotina, condicionamento e recuperação.
            </p>
          </div>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {options.map((item) => {
            const active = state.modalidades.includes(item.key);
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
                <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${item.glow}`} />

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
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        {hasAny ? (
          <div className="space-y-4">
            {state.modalidades.map((mod) => {
              const label = options.find((o) => o.key === mod)?.label ?? mod;
              const level = state.condicionamentoPorModalidade[mod] ?? "iniciante";
              const days = state.diasPorModalidade[mod] ?? [];

              return (
                <section
                  key={mod}
                  className="rounded-[24px] border border-white/10 bg-[rgba(8,10,18,0.82)] p-4 sm:p-5 shadow-[0_0_32px_rgba(0,149,255,0.04)]"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="text-[18px] font-semibold tracking-tight text-white">{label}</div>
                      <p className="mt-1 text-[12px] text-white/48">
                        Dias: {days.length} • Nível:{" "}
                        {level === "iniciante"
                          ? "Iniciante"
                          : level === "intermediario"
                          ? "Intermediário"
                          : "Avançado"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="text-[12px] uppercase tracking-[0.18em] text-white/35">
                      Condicionamento
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {(["iniciante", "intermediario", "avancado"] as const).map((lv) => {
                        const active = level === lv;
                        const txt =
                          lv === "iniciante"
                            ? "Iniciante"
                            : lv === "intermediario"
                            ? "Intermediário"
                            : "Avançado";

                        return (
                          <button
                            key={lv}
                            type="button"
                            onClick={() => setLevel(mod, lv)}
                            className={[
                              "rounded-full border px-3 py-2 text-[12px] transition-all",
                              active
                                ? "border-cyan-400/20 bg-cyan-400/10 text-cyan-300"
                                : "border-white/10 bg-black/20 text-white/65 hover:bg-white/[0.04]",
                            ].join(" ")}
                          >
                            {txt}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-5">
                    <div className="text-[12px] uppercase tracking-[0.18em] text-white/35">
                      Dias da semana
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {WEEK.map((d) => {
                        const active = days.includes(d.key);

                        return (
                          <button
                            key={d.key}
                            type="button"
                            onClick={() => toggleDay(mod, d.key)}
                            className={[
                              "min-w-[56px] rounded-[14px] border px-3 py-2 text-[11px] transition-all",
                              active
                                ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                                : "border-white/10 bg-black/20 text-white/65 hover:bg-white/[0.04]",
                            ].join(" ")}
                          >
                            {d.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          <section className="rounded-[24px] border border-white/10 bg-[rgba(8,10,18,0.82)] p-4 sm:p-5 shadow-[0_0_32px_rgba(0,149,255,0.04)]">
            <div className="rounded-[20px] border border-white/10 bg-black/20 p-4">
              <p className="text-[13px] leading-5 text-white/48">
                Selecione pelo menos uma modalidade para configurar os dias e o nível.
              </p>
            </div>
          </section>
        )}

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
            disabled={!hasAny}
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