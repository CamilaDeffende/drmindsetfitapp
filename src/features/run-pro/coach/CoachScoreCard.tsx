import type { RunSample } from "@/features/run-pro/stats/compute";
import { computeCoachScore } from "@/features/run-pro/coach/score";

export function CoachScoreCard({ samples }: { samples: RunSample[] }) {
  const { score, label, reasons } = computeCoachScore(samples);

  const badge =
    label === "Elite" ? "border-emerald-500/30 text-emerald-300" :
    label === "Bom" ? "border-sky-500/30 text-sky-300" :
    "border-amber-500/30 text-amber-300";

  return (
    <div className="mt-6 rounded-2xl border bg-card p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold">Coach Score</div>
          <div className="mt-1 text-xs text-muted-foreground">
            Leitura inteligente baseada em consistência, sinal GPS e pausas.
          </div>
        </div>

        <div className={"rounded-xl border px-3 py-1 text-xs font-semibold " + badge}>
          {label}
        </div>
      </div>

      <div className="mt-4 flex items-end gap-3">
        <div className="text-4xl font-semibold leading-none">{score}</div>
        <div className="pb-1 text-xs text-muted-foreground">/ 100</div>
      </div>

      <div className="mt-4 space-y-2">
        {reasons.map((r, i) => (
          <div key={i} className="rounded-xl border bg-background px-3 py-2 text-sm">
            {r}
          </div>
        ))}
      </div>
    </div>
  );
}
