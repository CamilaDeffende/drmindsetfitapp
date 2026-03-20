// MF_ONBOARDING_CONTRACT_V2
// Step5Modalidades – múltiplas modalidades + dias por modalidade + nível por modalidade
// Compat com primary/secondary
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { useOnboardingDraftSaver } from "@/store/onboarding/useOnboardingDraftSaver";

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
      { key: "musculacao", label: "Musculação" },
      { key: "corrida", label: "Corrida" },
      { key: "bike", label: "Bike" },
      { key: "funcional", label: "Funcional" },
      { key: "cross", label: "Cross" },
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

      const nextPrimary =
        value.primary !== undefined ? value.primary : prev.primary;

      const nextSecondary =
        value.secondary !== undefined ? value.secondary : prev.secondary;

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
      const cur = Array.isArray(prev.diasPorModalidade[mod])
        ? prev.diasPorModalidade[mod]
        : [];

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
    <div data-testid="mf-step-root" className="w-full text-white">
      <h2 className="text-xl font-semibold">Modalidades</h2>
      <p className="mt-1 text-sm text-white/60">
        Selecione quantas modalidades quiser. Para cada uma, defina dias e condicionamento.
      </p>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {options.map((o) => {
          const active = state.modalidades.includes(o.key);

          return (
            <button
              key={o.key}
              type="button"
              onClick={() => toggleModality(o.key)}
              className={[
                "p-4 rounded-xl border text-left transition",
                active
                  ? "border-white/30 bg-white/10"
                  : "border-white/10 bg-white/5 hover:bg-white/10",
              ].join(" ")}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{o.label}</span>
                <span className="text-xs text-white/60">
                  {active ? "Selecionado" : ""}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {hasAny ? (
        <div className="mt-6 space-y-4">
          {state.modalidades.map((mod) => {
            const label = options.find((o) => o.key === mod)?.label ?? mod;
            const level = state.condicionamentoPorModalidade[mod] ?? "iniciante";
            const days = state.diasPorModalidade[mod] ?? [];

            return (
              <div key={mod} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold">{label}</div>
                  <div className="text-xs text-white/60">
                    Dias: {days.length} • Nível:{" "}
                    {level === "iniciante"
                      ? "Iniciante"
                      : level === "intermediario"
                        ? "Intermediário"
                        : "Avançado"}
                  </div>
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
                          "px-3 py-2 rounded-xl border text-xs transition",
                          active
                            ? "border-white/30 bg-white/10"
                            : "border-white/10 bg-white/5 hover:bg-white/10",
                        ].join(" ")}
                      >
                        {txt}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-3">
                  <div className="text-xs text-white/60">Dias da semana</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {WEEK.map((d) => {
                      const active = days.includes(d.key);

                      return (
                        <button
                          key={d.key}
                          type="button"
                          onClick={() => toggleDay(mod, d.key)}
                          className={[
                            "min-w-[52px] px-3 py-2 rounded-xl border text-xs transition",
                            active
                              ? "border-white/30 bg-white/10"
                              : "border-white/10 bg-white/5 hover:bg-white/10",
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
      ) : (
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
          Selecione pelo menos uma modalidade para configurar dias e nível.
        </div>
      )}

      <div className="mt-6 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => onBack?.()}
          className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition"
        >
          Voltar
        </button>

        <button
          type="button"
          onClick={() => onNext?.()}
          disabled={!hasAny}
          className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continuar
        </button>
      </div>
    </div>
  );
}