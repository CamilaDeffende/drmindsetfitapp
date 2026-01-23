import { useMemo } from "react";
import type { RunMetrics, RunSample } from "@/features/run-pro/engine/types";
import { computeCoachScore } from "./score";

type Props = {
  samples: RunSample[];
  metrics?: RunMetrics | null;
};

export function CoachScoreCard({ samples, metrics }: Props) {
  const res = useMemo(() => computeCoachScore(samples, metrics), [samples, metrics]);

  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">Coach Score</div>
          <div className="text-xs text-muted-foreground">qualidade, consistência e GPS</div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-semibold">{res.score == null ? "—" : res.score}</div>
          <div className="text-xs text-muted-foreground">{res.label}</div>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        {res.insights.map((t, i) => (
          <div key={i} className="rounded-xl border bg-background px-3 py-2 text-sm">
            {t}
          </div>
        ))}
      </div>
    </div>
  );
}
