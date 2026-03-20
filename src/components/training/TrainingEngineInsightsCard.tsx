import { useTrainingInsights } from "@/hooks/useTrainingInsights";

export default function TrainingEngineInsightsCard() {
  const { readiness, currentPlan } = useTrainingInsights();

  return (
    <section className="rounded-2xl border border-white/10 bg-black/20 p-4 backdrop-blur-md">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-white/80">
            Training Engine
          </h3>
          <p className="text-xs text-white/50">
            Prontidão, fadiga e estado canônico do plano
          </p>
        </div>
        <div className="rounded-xl border border-white/10 px-3 py-1 text-xs text-white/70">
          Score {readiness.score}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-white/10 p-3">
          <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">Readiness</div>
          <div className="mt-1 text-sm font-semibold text-white">{readiness.level}</div>
          <div className="mt-1 text-xs text-white/55">{readiness.rationale}</div>
        </div>

        <div className="rounded-xl border border-white/10 p-3">
          <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">Recomendação</div>
          <div className="mt-1 text-sm font-semibold text-white">{readiness.recommendation}</div>
          <div className="mt-1 text-xs text-white/55">
            Ajuste sugerido: {readiness.recommendedLoadAdjustmentPct}%
          </div>
        </div>

        <div className="rounded-xl border border-white/10 p-3">
          <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">Hotspots</div>
          <div className="mt-1 text-sm font-semibold text-white">
            {Array.isArray(readiness.fatigueHotspots) ? readiness.fatigueHotspots.length : 0}
          </div>
          <div className="mt-1 text-xs text-white/55">
            Microciclo: {readiness.microcycle ? "monitorado" : "indisponível"}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 p-3">
          <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">Plano</div>
          <div className="mt-1 text-sm font-semibold text-white">
            v{currentPlan?.version ?? "-"}
          </div>
          <div className="mt-1 text-xs text-white/55">
            Sessões: {currentPlan?.sessions?.length ?? 0}
          </div>
        </div>
      </div>
    </section>
  );
}
