// MF_ONBOARDING_CONTRACT_V2
// Step5Modalidades – agora captura:
// - múltiplas modalidades
// - dias por modalidade (seg..dom)
// - nível/condicionamento por modalidade (iniciante/intermediario/avancado)
// Persistência canônica no mf_onboarding_draft:
//   modalidadesSelecionadas: string[]
//   diasPorModalidade: Record<string, string[]>
//   condicionamentoPorModalidade: Record<string, "iniciante"|"intermediario"|"avancado">
// Mantém compatibilidade: step5Modalidades (inclui primary/secondary)

import React, { useCallback, useEffect, useMemo } from "react";
import { useOnboardingDraftSaver } from "@/store/onboarding/useOnboardingDraftSaver";


// MF_STEP5_PERSIST_DRAFT_V1
function mfPersistDraftModalidadesDias(payload: any) {
  try {
    const rawA = localStorage.getItem("mf_onboarding_draft") || "{}";
    const rawB = localStorage.getItem("MF_ONBOARDING_DRAFT") || "{}";
    const a = JSON.parse(rawA);
    const b = JSON.parse(rawB);

    const nextA = { ...a, ...payload };
    const nextB = { ...b, ...payload };

    localStorage.setItem("mf_onboarding_draft", JSON.stringify(nextA));
    localStorage.setItem("MF_ONBOARDING_DRAFT", JSON.stringify(nextB));
  } catch {
    // noop
  }
}

type MF_Level = "iniciante" | "intermediario" | "avancado";

type Step5Value = {
  // compat legado
  primary: string | null;
  secondary?: string | null;

  // novo
  modalidades: string[]; // multi-select
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
    // DEMO-safe: não quebra
  }
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

export default function Step5Modalidades({ value, onChange, onBack}: Props) {
  // MF_STEP5_PERSIST_EFFECT_V1
  // Persistência contínua do draft: ao mudar seleção, salva modalidades + diasSemana.
  useEffect(() => {
    try {
      const v: any = value ?? {};
      const modalidades = v.modalidades ?? v.selectedModalidades ?? v.modalities ?? v.selectedModalities ?? [];
      const diasSemana = v.diasSemana ?? v.selectedDays ?? v.weekDays ?? v.trainingDays ?? [];
      mfPersistDraftModalidadesDias({ modalidades, diasSemana });
    } catch {}
  }, [value]);

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

  // hidrata do draft canônico + props.value (sem depender do shell)
  const initial = useMemo<Step5Value>(() => {
    const draft = readDraft();

    const modalitiesFromDraft = uniqStable(
      (Array.isArray(draft?.modalidadesSelecionadas) ? draft.modalidadesSelecionadas : [])
        .map((x: any) => String(x || ""))
        .filter(Boolean)
    );

    const diasFromDraft = (draft?.diasPorModalidade && typeof draft.diasPorModalidade === "object")
      ? (draft.diasPorModalidade as Record<string, string[]>)
      : {};

    const condFromDraftRaw = (draft?.condicionamentoPorModalidade && typeof draft.condicionamentoPorModalidade === "object")
      ? (draft.condicionamentoPorModalidade as Record<string, any>)
      : {};

    const condFromDraft: Record<string, MF_Level> = {};
    for (const k of Object.keys(condFromDraftRaw)) condFromDraft[k] = normalizeLevel(condFromDraftRaw[k]);

    const modalitiesFromProps = uniqStable(
      (Array.isArray(value?.modalidades) ? (value?.modalidades as string[]) : [])
        .map((x) => String(x || ""))
        .filter(Boolean)
    );

    const modalities = uniqStable([...modalitiesFromDraft, ...modalitiesFromProps]);

    // compat: primary/secondary
    const primary = (value?.primary ?? draft?.step5Modalidades?.primary ?? (modalities[0] ?? null)) as string | null;
    const secondary = (value?.secondary ?? draft?.step5Modalidades?.secondary ?? (modalities[1] ?? null)) as string | null;

    const diasPorModalidade: Record<string, string[]> = { ...diasFromDraft, ...(value?.diasPorModalidade ?? {}) } as any;
    const condicionamentoPorModalidade: Record<string, MF_Level> = { ...condFromDraft, ...(value?.condicionamentoPorModalidade ?? {}) } as any;

    // defaults: se modalidade existe e não tem nível, assume iniciante
    for (const m of modalities) {
      if (!condicionamentoPorModalidade[m]) condicionamentoPorModalidade[m] = "iniciante";
      if (!Array.isArray(diasPorModalidade[m])) diasPorModalidade[m] = [];
    }

    return {
      primary,
      secondary: secondary ?? null,
      modalidades: modalities,
      diasPorModalidade,
      condicionamentoPorModalidade,
    };
  }, [value]);

  const [state, setState] = React.useState<Step5Value>(initial);

  // se mudar o initial (ex: refresh), re-hidrata uma vez
  useEffect(() => {
    setState(initial);
  }, [JSON.stringify(initial)]);

  const safeOnChange = onChange ?? (() => {});

  // persistência canônica + compat
  useEffect(() => {
    // canônico para o motor do Step6
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

  // autosave (mantém a infra existente)
  useOnboardingDraftSaver({ step5Modalidades: state } as any, 400);

  const toggleModality = useCallback((key: string) => {
    setState((prev) => {
      const has = prev.modalidades.includes(key);
      const nextModalidades = has ? prev.modalidades.filter((m) => m !== key) : [...prev.modalidades, key];
      const modalidades = uniqStable(nextModalidades);

      const diasPorModalidade = { ...prev.diasPorModalidade };
      const condicionamentoPorModalidade = { ...prev.condicionamentoPorModalidade };

      // init defaults
      if (!diasPorModalidade[key]) diasPorModalidade[key] = [];
      if (!condicionamentoPorModalidade[key]) condicionamentoPorModalidade[key] = "iniciante";

      // se removeu, limpa mapas pra evitar lixo
      if (has) {
        delete diasPorModalidade[key];
        delete condicionamentoPorModalidade[key];
      }

      const primary = modalidades[0] ?? null;
      const secondary = modalidades[1] ?? null;

      return { ...prev, modalidades, primary, secondary, diasPorModalidade, condicionamentoPorModalidade };
    });
  }, []);

  const toggleDay = useCallback((mod: string, day: string) => {
    setState((prev) => {
      const cur = Array.isArray(prev.diasPorModalidade[mod]) ? prev.diasPorModalidade[mod] : [];
      const has = cur.includes(day);
      const next = has ? cur.filter((d) => d !== day) : [...cur, day];
      return {
        ...prev,
        diasPorModalidade: { ...prev.diasPorModalidade, [mod]: uniqStable(next) },
      };
    });
  }, []);

  const setLevel = useCallback((mod: string, level: MF_Level) => {
    setState((prev) => ({
      ...prev,
      condicionamentoPorModalidade: { ...prev.condicionamentoPorModalidade, [mod]: level },
    }));
  }, []);

  const hasAny = state.modalidades.length > 0;
  return (
    <div data-testid="mf-step-root">
      <h2 className="text-xl font-semibold">Modalidades</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Selecione quantas modalidades quiser. Para cada uma, defina dias e condicionamento.
      </p>

      {/* seleção multi */}
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
                <span className="text-xs text-white/60">{active ? "Selecionado" : ""}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* configurações por modalidade */}
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
                    {level === "iniciante" ? "Iniciante" : level === "intermediario" ? "Intermediário" : "Avançado"}
                  </div>
                </div>

                {/* nível */}
                <div className="mt-3 flex flex-wrap gap-2">
                  {(["iniciante", "intermediario", "avancado"] as const).map((lv) => {
                    const active = level === lv;
                    const txt = lv === "iniciante" ? "Iniciante" : lv === "intermediario" ? "Intermediário" : "Avançado";
                    return (
                      <button
                        key={lv}
                        type="button"
                        onClick={() => setLevel(mod, lv)}
                        className={[
                          "px-3 py-2 rounded-xl border text-xs transition",
                          active ? "border-white/30 bg-white/10" : "border-white/10 bg-white/5 hover:bg-white/10",
                        ].join(" ")}
                      >
                        {txt}
                      </button>
                    );
                  })}
                </div>

                {/* dias */}
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
                            active ? "border-white/30 bg-white/10" : "border-white/10 bg-white/5 hover:bg-white/10",
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


      </div>
    </div>
  );
}
