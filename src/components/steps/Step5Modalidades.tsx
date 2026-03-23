// MF_ONBOARDING_CONTRACT_V2
// Step5Modalidades - multiplas modalidades + dias por modalidade + nivel por modalidade
// Compat com primary/secondary
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { useOnboardingDraftSaver } from "@/store/onboarding/useOnboardingDraftSaver";
import { Button } from "@/components/ui/button";
import {
  Activity,
  Bike,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Flame,
  PersonStanding,
  Trophy,
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

const LS_KEY = "mf:onboarding:draft:v1";
const LEGACY_LS_KEY = "mf_onboarding_draft";

const WEEK = [
  { key: "seg", label: "SEG" },
  { key: "ter", label: "TER" },
  { key: "qua", label: "QUA" },
  { key: "qui", label: "QUI" },
  { key: "sex", label: "SEX" },
  { key: "sab", label: "SAB" },
  { key: "dom", label: "DOM" },
] as const;

const LEVEL_OPTIONS: { key: MF_Level; label: string; desc: string }[] = [
  { key: "iniciante", label: "Iniciante", desc: "Base tecnica e adaptacao." },
  { key: "intermediario", label: "Intermediario", desc: "Mais volume e progressao." },
  { key: "avancado", label: "Avancado", desc: "Maior intensidade e refinamento." },
];

function readDraft(): any {
  try {
    const raw = localStorage.getItem(LS_KEY) ?? localStorage.getItem(LEGACY_LS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeDraft(patch: any) {
  try {
    const prev = readDraft();
    const next = { ...prev, ...patch };
    const serialized = JSON.stringify(next);
    localStorage.setItem(LS_KEY, serialized);
    localStorage.setItem(LEGACY_LS_KEY, serialized);
  } catch {}
}

function uniqStable(arr: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();

  for (const x of arr) {
    const k = String(x || "").trim();
    if (!k) continue;
    if (seen.has(k)) continue;
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
        label: "Musculacao",
        desc: "Forca, hipertrofia e estrutura.",
        icon: Dumbbell,
      },
      {
        key: "corrida",
        label: "Corrida",
        desc: "Base aerobica e performance.",
        icon: Activity,
      },
      {
        key: "bike",
        label: "Bike",
        desc: "Cardio com menor impacto articular.",
        icon: Bike,
      },
      {
        key: "funcional",
        label: "Funcional",
        desc: "Movimento global e condicionamento.",
        icon: PersonStanding,
      },
      {
        key: "cross",
        label: "Cross",
        desc: "Alta intensidade e variabilidade.",
        icon: Trophy,
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
      draft?.condicionamentoPorModalidade &&
      typeof draft.condicionamentoPorModalidade === "object"
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
      modalidades[0] ??
      null) as string | null;

    const secondary = (value?.secondary ??
      draft?.step5Modalidades?.secondary ??
      modalidades[1] ??
      null) as string | null;

    const diasPorModalidade: Record<string, string[]> = {
      ...diasFromDraft,
      ...(value?.diasPorModalidade ?? {}),
    };

    const condicionamentoPorModalidade: Record<string, MF_Level> = {
      ...condFromDraft,
      ...(value?.condicionamentoPorModalidade ?? {}),
    };

    for (const m of modalidades) {
      if (!condicionamentoPorModalidade[m]) {
        condicionamentoPorModalidade[m] = "iniciante";
      }
      if (!Array.isArray(diasPorModalidade[m])) {
        diasPorModalidade[m] = [];
      }
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

  const safeOnChange = onChange ?? (() => {});
  const lastSentRef = useRef("");

  useEffect(() => {
    if (!value) return;

    setState((prev) => {
      const nextModalidades = Array.isArray(value.modalidades)
        ? uniqStable(value.modalidades)
        : prev.modalidades;

      const nextDias =
        value.diasPorModalidade && typeof value.diasPorModalidade === "object"
          ? value.diasPorModalidade
          : prev.diasPorModalidade;

      const nextCond =
        value.condicionamentoPorModalidade &&
        typeof value.condicionamentoPorModalidade === "object"
          ? value.condicionamentoPorModalidade
          : prev.condicionamentoPorModalidade;

      const nextPrimary = value.primary !== undefined ? value.primary : prev.primary;
      const nextSecondary = value.secondary !== undefined ? value.secondary : prev.secondary;

      const changed =
        JSON.stringify(prev.modalidades) !== JSON.stringify(nextModalidades) ||
        JSON.stringify(prev.diasPorModalidade) !== JSON.stringify(nextDias) ||
        JSON.stringify(prev.condicionamentoPorModalidade) !== JSON.stringify(nextCond) ||
        prev.primary !== nextPrimary ||
        prev.secondary !== nextSecondary;

      if (!changed) return prev;

      return {
        ...prev,
        modalidades: nextModalidades,
        diasPorModalidade: nextDias,
        condicionamentoPorModalidade: nextCond,
        primary: nextPrimary,
        secondary: nextSecondary,
      };
    });
  }, [value]);

  useEffect(() => {
    const payload: Step5Value = {
      primary: state.primary,
      secondary: state.secondary ?? null,
      modalidades: state.modalidades,
      diasPorModalidade: state.diasPorModalidade,
      condicionamentoPorModalidade: state.condicionamentoPorModalidade,
    };

    const serialized = JSON.stringify(payload);
    if (lastSentRef.current === serialized) return;
    lastSentRef.current = serialized;

    writeDraft({
      modalidadesSelecionadas: state.modalidades,
      diasPorModalidade: state.diasPorModalidade,
      condicionamentoPorModalidade: state.condicionamentoPorModalidade,
      step5Modalidades: payload,
    });

    safeOnChange(payload);
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
      if (!condicionamentoPorModalidade[key]) {
        condicionamentoPorModalidade[key] = "iniciante";
      }

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
    <div data-testid="mf-step-root" className="w-full text-white space-y-6">
      <section className="rounded-[24px] border border-white/10 bg-[rgba(8,10,18,0.82)] p-5 sm:p-6 shadow-[0_0_32px_rgba(0,149,255,0.06)]">
        <h2 className="text-[22px] font-semibold tracking-tight">Estrutura de modalidades</h2>

        <p className="mt-1 text-[13px] leading-5 text-white/50">
          Defina quais frentes de treino entram no seu plano e como cada uma será distribuída na semana.
        </p>

        <div className="mt-4 rounded-[20px] border border-white/10 bg-[linear-gradient(180deg,rgba(20,30,56,0.55),rgba(8,10,18,0.9))] p-4">
          <div className="text-[12px] uppercase tracking-[0.18em] text-white/35">
            Montagem da rotina
          </div>
          <p className="mt-2 text-[14px] leading-6 text-white/72">
            Você pode combinar modalidades e calibrar o nível de cada uma. Isso ajuda o app a gerar uma semana mais coerente no próximo step.
          </p>
        </div>
      </section>

      <section className="rounded-[24px] border border-white/10 bg-[rgba(8,10,18,0.82)] p-5 sm:p-6 shadow-[0_0_32px_rgba(0,149,255,0.06)]">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-cyan-300" />
          <h3 className="text-[18px] font-semibold">Selecione as modalidades</h3>
        </div>

        <p className="mt-1 text-[13px] text-white/50">
          Escolha uma ou mais opções para construir sua semana de treino.
        </p>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {options.map((o) => {
            const active = state.modalidades.includes(o.key);
            const Icon = o.icon;

            return (
              <button
                key={o.key}
                type="button"
                onClick={() => toggleModality(o.key)}
                className={[
                  "rounded-[20px] border p-4 text-left transition-all",
                  active
                    ? "border-cyan-400/35 bg-cyan-400/10 shadow-[0_0_24px_rgba(0,183,255,0.12)]"
                    : "border-white/10 bg-black/20 hover:bg-white/[0.04] hover:border-white/20",
                ].join(" ")}
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] border border-white/10 bg-black/20 text-cyan-300">
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[16px] font-semibold text-white">{o.label}</span>
                      <span className="text-[11px] text-white/55">{active ? "Selecionada" : ""}</span>
                    </div>
                    <div className="mt-1 text-[12px] leading-5 text-white/48">{o.desc}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {hasAny ? (
        <section className="rounded-[24px] border border-white/10 bg-[rgba(8,10,18,0.82)] p-5 sm:p-6 shadow-[0_0_32px_rgba(0,149,255,0.06)]">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-cyan-300" />
            <h3 className="text-[18px] font-semibold">Configuração por modalidade</h3>
          </div>

          <p className="mt-1 text-[13px] text-white/50">
            Ajuste o condicionamento e marque os dias de cada modalidade selecionada.
          </p>

          <div className="mt-5 space-y-4">
            {state.modalidades.map((mod) => {
              const label = options.find((o) => o.key === mod)?.label ?? mod;
              const level = state.condicionamentoPorModalidade[mod] ?? "iniciante";
              const days = state.diasPorModalidade[mod] ?? [];

              return (
                <div key={mod} className="rounded-[22px] border border-white/10 bg-black/20 p-4 sm:p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-[16px] font-semibold text-white">{label}</div>
                    <div className="text-[12px] text-white/55">
                      Dias: {days.length} • Nível:{" "}
                      {level === "iniciante"
                        ? "Iniciante"
                        : level === "intermediario"
                        ? "Intermediario"
                        : "Avancado"}
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="mb-2 text-[12px] uppercase tracking-[0.14em] text-white/35">
                      Condicionamento
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {LEVEL_OPTIONS.map((lv) => {
                        const active = level === lv.key;

                        return (
                          <button
                            key={lv.key}
                            type="button"
                            onClick={() => setLevel(mod, lv.key)}
                            className={[
                              "rounded-[16px] border px-3 py-3 text-left transition-all",
                              active
                                ? "border-emerald-400/35 bg-emerald-400/10"
                                : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]",
                            ].join(" ")}
                          >
                            <div className="text-[13px] font-semibold text-white">{lv.label}</div>
                            <div className="mt-1 text-[11px] leading-4 text-white/45">{lv.desc}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="text-[12px] uppercase tracking-[0.14em] text-white/35">
                      Dias da semana
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {WEEK.map((d) => {
                        const active = days.includes(d.key);

                        return (
                          <button
                            key={d.key}
                            type="button"
                            onClick={() => toggleDay(mod, d.key)}
                            className={[
                              "min-w-[56px] rounded-[14px] border px-3 py-2 text-[12px] font-medium transition-all",
                              active
                                ? "border-cyan-400/35 bg-cyan-400/10 text-white"
                                : "border-white/10 bg-white/[0.03] text-white/70 hover:bg-white/[0.06]",
                            ].join(" ")}
                          >
                            {d.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : (
        <section className="rounded-[24px] border border-white/10 bg-[rgba(8,10,18,0.82)] p-5 sm:p-6 shadow-[0_0_32px_rgba(0,149,255,0.06)]">
          <div className="rounded-[20px] border border-white/10 bg-black/20 p-4 text-[14px] text-white/70">
            Selecione pelo menos uma modalidade para configurar dias e nível.
          </div>
        </section>
      )}

      <div className="flex gap-3 pt-1">
        {onBack ? (
          <Button
            type="button"
            onClick={() => onBack?.()}
            variant="outline"
            className="h-14 w-[120px] rounded-[20px] border-white/15 bg-black/20 text-white hover:bg-white/5"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Voltar
          </Button>
        ) : null}

        <Button
          type="button"
          onClick={() => onNext?.()}
          disabled={!hasAny}
          variant="ghost"
          className="h-14 flex-1 overflow-hidden rounded-[20px] border-0 bg-gradient-to-r from-[#193B72] via-[#255AA8] to-[#7FE9D6] text-white shadow-[0_10px_30px_rgba(0,149,255,0.18)] transition-all hover:brightness-110 hover:bg-transparent disabled:opacity-50"
        >
          Continuar
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
