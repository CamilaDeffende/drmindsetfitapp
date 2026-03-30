import { GamificationCard } from "@/components/gamification/GamificationCard";
import { useAI } from "@/hooks/useAI/useAI";
import { mfGetLoad7dFromHistory } from "@/services/history/HistoryService";
import { assessTrainingLoad } from "@/services/training/loadGuardrails";

function Badge({ text }: { text: string }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/75">
      {text}
    </span>
  );
}

function getLoadSummary() {
  try {
    const l7 = mfGetLoad7dFromHistory(new Date());
    const risk = assessTrainingLoad({
      last7dSessions: l7.sessions,
      last7dMinutes: l7.minutes,
      last7dAvgRPE: l7.avgRPE,
      sleepScore: l7.sleepScore,
      sorenessScore: l7.sorenessScore,
    });

    const label =
      risk.risk === "high" ? "Alta" : risk.risk === "moderate" ? "Moderada" : "Baixa";

    return `${label} • ${l7.sessions} sessoes • ${Math.round(l7.minutes)} min • RPE ~${l7.avgRPE.toFixed(1)}`;
  } catch {
    return "Dados insuficientes para calcular carga.";
  }
}

export function AIInsights() {
  const { metrics, recs, weightPred, bestHour } = useAI();

  return (
    <div className="space-y-4">
      <div className="rounded-[24px] border border-white/10 bg-[rgba(8,10,18,0.82)] p-5 shadow-[0_0_32px_rgba(0,149,255,0.04)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-lg font-semibold text-white">Resumo IA</div>
            <div className="mt-1 text-sm text-white/55">
              Leitura adaptativa com sinais recentes de treino e recuperacao.
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge text={`${metrics.recoveryScore}/100 recuperacao`} />
            <Badge text={`Carga: ${metrics.loadTrend14d}`} />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-[18px] border border-white/10 bg-black/20 p-4">
            <div className="text-xs text-white/50">Treinos (7d)</div>
            <div className="mt-1 text-2xl font-semibold text-white">
              {metrics.workoutFrequency7d}
            </div>
          </div>

          <div className="rounded-[18px] border border-white/10 bg-black/20 p-4">
            <div className="text-xs text-white/50">PSE media (7d)</div>
            <div className="mt-1 text-2xl font-semibold text-white">{metrics.avgPSE7d || 0}</div>
          </div>

          <div className="rounded-[18px] border border-white/10 bg-black/20 p-4">
            <div className="text-xs text-white/50">Duracao media</div>
            <div className="mt-1 text-2xl font-semibold text-white">
              {metrics.avgDurationMin7d} min
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-[20px] border border-white/10 bg-black/20 p-4">
          <div className="text-xs uppercase tracking-[0.2em] text-white/45">
            Carga dos ultimos 7 dias
          </div>
          <div className="mt-2 text-sm text-white/82">{getLoadSummary()}</div>
        </div>

        <div className="mt-4 rounded-[20px] border border-white/10 bg-black/20 p-4">
          <div className="text-xs uppercase tracking-[0.2em] text-white/45">Peso previsto (ML)</div>
          <div className="mt-2 text-sm text-white/82">
            slope: {weightPred.slopeKgPerDay} kg/dia • R²: {weightPred.r2}
            {typeof weightPred.projectedKg7d === "number" ? ` • 7d: ${weightPred.projectedKg7d} kg` : ""}
            {typeof weightPred.projectedKg30d === "number"
              ? ` • 30d: ${weightPred.projectedKg30d} kg`
              : ""}
          </div>
        </div>

        <div className="mt-4 rounded-[20px] border border-white/10 bg-black/20 p-4">
          <div className="text-xs uppercase tracking-[0.2em] text-white/45">
            Melhor horario sugerido
          </div>
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
            <div className="rounded-[16px] border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-white/80">
              Corrida: {bestHour.corrida.hour}h
            </div>
            <div className="rounded-[16px] border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-white/80">
              Musculacao: {bestHour.musculacao.hour}h
            </div>
            <div className="rounded-[16px] border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-white/80">
              Ciclismo: {bestHour.ciclismo.hour}h
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[24px] border border-white/10 bg-[rgba(8,10,18,0.82)] p-5 shadow-[0_0_32px_rgba(0,149,255,0.04)]">
        <div className="text-lg font-semibold text-white">Recomendacoes</div>
        <div className="mt-4 space-y-3">
          {recs.length > 0 ? (
            recs.map((rec, idx) => (
              <div
                key={idx}
                className="rounded-[18px] border border-white/10 bg-black/20 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-white">{rec.title}</div>
                  <div className="text-[11px] uppercase tracking-[0.16em] text-white/45">
                    {rec.type}
                  </div>
                </div>
                <div className="mt-2 text-sm text-white/72">{rec.message}</div>
                {rec.action?.href ? (
                  <a
                    href={rec.action.href}
                    className="mt-3 inline-block text-xs font-semibold text-cyan-300 hover:text-cyan-200"
                  >
                    {rec.action.label} →
                  </a>
                ) : null}
              </div>
            ))
          ) : (
            <div className="rounded-[18px] border border-white/10 bg-black/20 p-4 text-sm text-white/60">
              Nenhuma recomendação disponível no momento.
            </div>
          )}
        </div>
      </div>

      <GamificationCard />
    </div>
  );
}
