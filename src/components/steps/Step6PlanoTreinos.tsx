// MF_STEP6_PLANO_TREINOS_V1
// Substitui Step6DiasSemana: Step5 ja captura dias + condicionamento por modalidade.
// Aqui exibimos a previa do plano gerado usando o banco de exercicios existente.

import React from "react";
import { Button } from "@/components/ui/button";
import { useOnboardingDraftSaver } from "@/store/onboarding/useOnboardingDraftSaver";
import { buildWorkoutPlanPreview } from "@/services/training/WorkoutPlanBuilder";
import { ChevronLeft, ChevronRight, Dumbbell, Flame, Sparkles } from "lucide-react";

type Props = {
  value?: any;
  draft?: any;
  onChange?: (v: any) => void;
  onNext?: () => void;
  onBack?: () => void;
};

const humanMod = (k: string) =>
  k === "musculacao"
    ? "Musculacao"
    : k === "corrida"
    ? "Corrida"
    : k === "bike"
    ? "Bike"
    : k === "funcional"
    ? "Funcional"
    : k === "cross"
    ? "Cross"
    : k;

const humanDay = (d: string) =>
  d === "seg"
    ? "SEG"
    : d === "ter"
    ? "TER"
    : d === "qua"
    ? "QUA"
    : d === "qui"
    ? "QUI"
    : d === "sex"
    ? "SEX"
    : d === "sab"
    ? "SAB"
    : d === "dom"
    ? "DOM"
    : d;

const humanLevel = (level: string) =>
  level === "iniciante"
    ? "Iniciante"
    : level === "intermediario"
    ? "Intermediário"
    : "Avançado";

export default function Step6PlanoTreinos({ value, draft: liveDraft, onChange, onNext, onBack }: Props) {
  const safeOnChange = onChange ?? (() => {});
  void safeOnChange;
  useOnboardingDraftSaver({ step6PlanoTreinos: value ?? null } as any, 400);

  const persistedDraft = React.useMemo(() => {
    try {
      const raw =
        localStorage.getItem("mf:onboarding:draft:v1") ??
        localStorage.getItem("mf_onboarding_draft");
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }, []);

  const previewDraft = React.useMemo(
    () => (liveDraft && typeof liveDraft === "object" ? liveDraft : persistedDraft),
    [liveDraft, persistedDraft]
  );

  const preview = React.useMemo(() => buildWorkoutPlanPreview(previewDraft), [previewDraft]);

  return (
    <div data-testid="mf-step-root" className="w-full text-white space-y-6">
      <section className="rounded-[24px] border border-white/10 bg-[rgba(8,10,18,0.82)] p-5 sm:p-6 shadow-[0_0_32px_rgba(0,149,255,0.06)]">
        <h2 className="text-[22px] font-semibold tracking-tight">Treinos gerados</h2>
        <p className="mt-1 text-[13px] leading-5 text-white/50">
          O motor montou uma prévia da sua semana com base nas modalidades, dias e condicionamento definidos no Step 5.
        </p>

        <div className="mt-4 rounded-[20px] border border-white/10 bg-[linear-gradient(180deg,rgba(20,30,56,0.55),rgba(8,10,18,0.9))] p-4">
          <div className="text-[12px] uppercase tracking-[0.18em] text-white/35">
            Previa inteligente
          </div>
          <p className="mt-2 text-[14px] leading-6 text-white/72">
            Esta etapa mostra a organização inicial da semana antes do plano final ser consolidado.
          </p>
        </div>
      </section>

      {preview.sessions.length === 0 ? (
        <section className="rounded-[24px] border border-white/10 bg-[rgba(8,10,18,0.82)] p-5 sm:p-6 shadow-[0_0_32px_rgba(0,149,255,0.06)]">
          <div className="rounded-[20px] border border-white/10 bg-black/20 p-4">
            <div className="text-[15px] font-semibold text-white">Nada para montar ainda</div>
            <div className="mt-1 text-[13px] text-white/60">
              Volte ao Step 5 e selecione pelo menos uma modalidade com dias da semana.
            </div>
          </div>
        </section>
      ) : (
        <section className="rounded-[24px] border border-white/10 bg-[rgba(8,10,18,0.82)] p-5 sm:p-6 shadow-[0_0_32px_rgba(0,149,255,0.06)]">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-cyan-300" />
            <h3 className="text-[18px] font-semibold">Distribuicao semanal</h3>
          </div>

          <p className="mt-1 text-[13px] text-white/50">
            Visualize como as sessões foram agrupadas ao longo da semana.
          </p>

          <div className="mt-5 space-y-4">
            {(["seg", "ter", "qua", "qui", "sex", "sab", "dom"] as const).map((dayKey) => {
              const daySessions = preview.sessions.filter((x) => x.day === dayKey);
              if (!daySessions.length) return null;

              return (
                <div key={dayKey} className="rounded-[22px] border border-white/10 bg-black/20 p-4 sm:p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-[14px] border border-white/10 bg-black/20 text-cyan-300">
                        <Sparkles className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-[16px] font-semibold text-white">{humanDay(dayKey)}</div>
                        <div className="text-[12px] text-white/45">Sessões planejadas para este dia</div>
                      </div>
                    </div>

                    <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] text-white/60">
                      {daySessions.length} sessão{daySessions.length > 1 ? "ões" : ""}
                    </div>
                  </div>

                  <div className="mt-4 space-y-3">
                    {daySessions.map((sess, idx) => (
                      <div key={idx} className="rounded-[20px] border border-white/10 bg-white/[0.03] p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-white/10 bg-black/20 text-cyan-300">
                              <Dumbbell className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="text-[15px] font-semibold text-white">
                                {humanMod(sess.modality)}
                              </div>
                              <div className="mt-1 text-[12px] text-white/50">
                                {humanLevel(sess.level)} • {(sess.exercises || []).length} exercicio{(sess.exercises || []).length !== 1 ? "s" : ""}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {(sess.exercises || []).map((e: any, j: number) => {
                            const name =
                              e?.name ??
                              e?.nome ??
                              e?.title ??
                              e?.titulo ??
                              e?.exerciseName ??
                              e?.label ??
                              `Exercicio ${j + 1}`;

                            return (
                              <div
                                key={j}
                                className="rounded-[14px] border border-white/10 bg-black/20 px-3 py-2 text-[12px] text-white/80"
                              >
                                {String(name)}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
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
          disabled={preview.sessions.length === 0}
          onClick={() => {
            if (!preview.sessions.length) return;
            onNext?.();
          }}
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
