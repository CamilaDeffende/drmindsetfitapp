import { useAI } from "@/hooks/useAI/useAI";

import { assessTrainingLoad } from "@/services/training/loadGuardrails";
import { mfGetLoad7dFromHistory } from "@/services/history/HistoryService";
function Badge({ t }: { t: string }) {
  return <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/80">{t}</span>;
}

export function AIInsights() {
  const { metrics, recs, weightPred } = useAI();

      {/* MF_AI_LOAD_WIDGET_V1 */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="text-xs uppercase tracking-[0.22em] opacity-70">Carga (últimos 7 dias)</div>
        <div className="mt-2 text-sm opacity-80">
          {(() => {
            try {
              const l7 = mfGetLoad7dFromHistory(new Date());
              const r = assessTrainingLoad({
                last7dSessions: l7.sessions,
                last7dMinutes: l7.minutes,
                last7dAvgRPE: l7.avgRPE,
                sleepScore: l7.sleepScore,
                sorenessScore: l7.sorenessScore,
              });
              const label = r.risk === "high" ? "ALTA" : r.risk === "moderate" ? "MODERADA" : "BAIXA";
              return (
                <span className="font-semibold text-white">
                  {label} • {l7.sessions} sessões • {Math.round(l7.minutes)} min • RPE ~{l7.avgRPE.toFixed(1)}
                </span>
              );
            } catch {
              return <span className="opacity-70">Dados insuficientes para calcular carga.</span>;
            }
          })()}
        </div>
      </div>


  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-zinc-900/60 border border-white/10 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="text-white font-semibold">Resumo IA</div>
          <div className="flex gap-2">
            <Badge t={`${metrics.recoveryScore}/100 recuperação`} />
            <Badge t={`Carga: ${metrics.loadTrend14d}`} />
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-white/5 p-3">
            <div className="text-xs text-white/60">Treinos (7d)</div>
            <div className="text-lg text-white font-semibold">{metrics.workoutFrequency7d}</div>
          </div>
          <div className="rounded-xl bg-white/5 p-3">
            <div className="text-xs text-white/60">PSE média (7d)</div>
            <div className="text-lg text-white font-semibold">{metrics.avgPSE7d || 0}</div>
          </div>
          <div className="rounded-xl bg-white/5 p-3">
            <div className="text-xs text-white/60">Duração média</div>
            <div className="text-lg text-white font-semibold">{metrics.avgDurationMin7d} min</div>
          </div>
        </div>

        <div className="mt-3 rounded-xl bg-white/5 p-3">
          <div className="text-xs text-white/60">Peso (ML)</div>
          <div className="mt-1 text-sm text-white/90">
            slope: {weightPred.slopeKgPerDay} kg/dia · R²: {weightPred.r2}
            {typeof weightPred.projectedKg7d === "number" ? ` · 7d: ${weightPred.projectedKg7d} kg` : ""}
            {typeof weightPred.projectedKg30d === "number" ? ` · 30d: ${weightPred.projectedKg30d} kg` : ""}
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-zinc-900/60 border border-white/10 p-4">
        <div className="text-white font-semibold">Recomendações</div>
        <div className="mt-3 space-y-2">
          {recs.map((r, idx) => (
            <div key={idx} className="rounded-xl bg-white/5 p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm text-white">{r.title}</div>
                <div className="text-xs text-white/60">{r.type}</div>
              </div>
              <div className="mt-1 text-xs text-white/70">{r.message}</div>
              {r.action?.href ? (
                <a href={r.action.href} className="mt-2 inline-block text-xs text-blue-400 hover:text-blue-300">
                  {r.action.label} →
                </a>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
