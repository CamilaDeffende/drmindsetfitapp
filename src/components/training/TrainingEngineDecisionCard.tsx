import { useTrainingInsights } from "@/hooks/useTrainingInsights";

export default function TrainingEngineDecisionCard() {
  const { latestDecision } = useTrainingInsights();

  if (!latestDecision) {
    return (
      <section className="rounded-2xl border border-white/10 bg-black/20 p-4 backdrop-blur-md">
        <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-white/80">
          Última decisão do motor
        </h3>
        <p className="mt-2 text-sm text-white/55">
          Ainda não há decisões adaptativas persistidas.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-black/20 p-4 backdrop-blur-md">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-white/80">
          Última decisão do motor
        </h3>
        <span className="rounded-xl border border-white/10 px-3 py-1 text-xs text-white/70">
          Confiança {(latestDecision.confidence * 100).toFixed(0)}%
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-white/10 p-3">
          <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">Ações</div>
          <div className="mt-1 text-sm font-semibold text-white">
            {latestDecision.actions.join(", ")}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 p-3">
          <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">Carga</div>
          <div className="mt-1 text-sm font-semibold text-white">
            {latestDecision.recommendedLoadAdjustmentPct}%
          </div>
        </div>

        <div className="rounded-xl border border-white/10 p-3">
          <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">Volume</div>
          <div className="mt-1 text-sm font-semibold text-white">
            {latestDecision.recommendedVolumeAdjustmentPct}%
          </div>
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-white/10 p-3">
        <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">Rationale</div>
        <ul className="mt-2 space-y-1 text-sm text-white/60">
          {latestDecision.rationale.map((item, idx) => (
            <li key={`${item}-${idx}`}>• {item}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
