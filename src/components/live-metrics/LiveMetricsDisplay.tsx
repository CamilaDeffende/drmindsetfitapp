import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fmtDistance, fmtPace, fmtSpeed, fmtTime } from "./format";

type Props = {
  distanceM: number;
  durationS: number;
  paceSecPerKm?: number | null;
  avgSpeedMps?: number | null;
  maxSpeedMps?: number | null;
  accuracy?: number | null;
};

export const LiveMetricsDisplay: React.FC<Props> = ({
  distanceM,
  durationS,
  paceSecPerKm,
  avgSpeedMps,
  maxSpeedMps,
  accuracy,
}) => {
  return (
    <Card className="bg-zinc-900/70 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-white">Métricas ao vivo</CardTitle>
        <p className="text-xs text-zinc-400">
          Distância, tempo e ritmo estimados pelo GPS (best-effort).
        </p>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-zinc-950/40 border border-zinc-800 p-3">
          <div className="text-xs text-zinc-400">Tempo</div>
          <div className="text-xl font-semibold text-white">{fmtTime(durationS)}</div>
        </div>

        <div className="rounded-xl bg-zinc-950/40 border border-zinc-800 p-3">
          <div className="text-xs text-zinc-400">Distância</div>
          <div className="text-xl font-semibold text-white">{fmtDistance(distanceM)}</div>
        </div>

        <div className="rounded-xl bg-zinc-950/40 border border-zinc-800 p-3">
          <div className="text-xs text-zinc-400">Ritmo</div>
          <div className="text-xl font-semibold text-white">{fmtPace(paceSecPerKm)}</div>
        </div>

        <div className="rounded-xl bg-zinc-950/40 border border-zinc-800 p-3">
          <div className="text-xs text-zinc-400">Vel. média</div>
          <div className="text-xl font-semibold text-white">{fmtSpeed(avgSpeedMps)}</div>
        </div>

        <div className="rounded-xl bg-zinc-950/40 border border-zinc-800 p-3">
          <div className="text-xs text-zinc-400">Vel. máx</div>
          <div className="text-lg font-semibold text-white">{fmtSpeed(maxSpeedMps)}</div>
        </div>

        <div className="rounded-xl bg-zinc-950/40 border border-zinc-800 p-3">
          <div className="text-xs text-zinc-400">Precisão</div>
          <div className="text-lg font-semibold text-white">
            {accuracy && accuracy > 0 ? `${Math.round(accuracy)} m` : "—"}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
