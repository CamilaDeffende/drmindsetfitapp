// MF_STEP6_PLANO_TREINOS_V1
// Substitui Step6DiasSemana: Step5 já captura dias + condicionamento por modalidade.
// Aqui exibimos a prévia do plano gerado usando o banco de exercícios existente.

import React from "react";
import { useOnboardingDraftSaver } from "@/store/onboarding/useOnboardingDraftSaver";
import { buildWorkoutPlanPreview } from "@/services/training/WorkoutPlanBuilder";

type Props = {
  value?: any;
  onChange?: (v: any) => void;
  onNext?: () => void;
  onBack?: () => void;
};

const humanMod = (k: string) =>
  k === "musculacao" ? "Musculação" :
  k === "corrida" ? "Corrida" :
  k === "bike" ? "Bike" :
  k === "funcional" ? "Funcional" :
  k === "cross" ? "Cross" : k;

const humanDay = (d: string) =>
  d === "seg" ? "SEG" :
  d === "ter" ? "TER" :
  d === "qua" ? "QUA" :
  d === "qui" ? "QUI" :
  d === "sex" ? "SEX" :
  d === "sab" ? "SAB" :
  d === "dom" ? "DOM" : d;

export default function Step6PlanoTreinos({ value, onChange, onNext, onBack }: Props) {
  // contrato do shell
  const safeOnChange = onChange ?? (() => {});
  void safeOnChange;
  useOnboardingDraftSaver({ step6PlanoTreinos: value ?? null } as any, 400);

  // lê draft canônico (DEMO-safe)
  const draft = React.useMemo(() => {
    try {
      const raw = localStorage.getItem("mf_onboarding_draft");
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }, []);

  const preview = React.useMemo(() => buildWorkoutPlanPreview(draft), [draft]);

  return (
    <div data-testid="mf-step-root">
      <h2 className="text-xl font-semibold">Treinos gerados</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        O motor inteligente montou uma prévia com base nas modalidades, dias e condicionamento definidos no Step 5.
      </p>

      {preview.sessions.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-sm font-medium">Nada para montar ainda</div>
          <div className="mt-1 text-xs text-white/60">
            Volte ao Step 5 e selecione pelo menos uma modalidade com dias da semana.
          </div>
        </div>
      ):
        (
          <div className="mt-5 space-y-6">
            {(["seg","ter","qua","qui","sex","sab","dom"] as const).map((dayKey) => {
              const daySessions = preview.sessions.filter((x) => x.day === dayKey);
              if (!daySessions.length) return null;

              return (
                <div key={dayKey} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold">{humanDay(dayKey)}</div>
                    <div className="text-[11px] text-white/55">
                      Sessões: {daySessions.length}
                    </div>
                  </div>

                  <div className="mt-4 space-y-3">
                    {daySessions.map((sess, idx) => (
                      <div key={idx} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-sm font-semibold">
                            {humanMod(sess.modality)}
                          </div>
                          <div className="text-xs text-white/60">
                            {sess.level === "iniciante" ? "Iniciante" : sess.level === "intermediario" ? "Intermediário" : "Avançado"} • Exercícios: {(sess.exercises || []).length}
                          </div>
                        </div>

                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {(sess.exercises || []).map((e: any, j: number) => {
                            const name =
                              e?.name ?? e?.nome ?? e?.title ?? e?.titulo ??
                              e?.exerciseName ?? e?.label ?? `Exercício ${j + 1}`;
                            return (
                              <div key={j} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80">
                                {String(name)}
                              </div>
                            );
                          })}
                        </div>

                        <div className="mt-2 text-[11px] text-white/55">
                          Banco: <code className="text-white/70">src/features/fitness-suite/data/exercises.ts</code>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )
      }

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
          disabled={preview.sessions.length === 0}
          onClick={() => {
            if (!preview.sessions.length) return;
            onNext?.();
          }}
          className={[
            "px-4 py-2 rounded-xl transition",
            preview.sessions.length ? "bg-white text-black hover:bg-white/90" : "bg-white/20 text-white/50 cursor-not-allowed",
          ].join(" ")}
        >
          Continuar
        </button>
      </div>
    </div>
  );
}
