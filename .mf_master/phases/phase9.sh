#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

echo "==> Phase 9 | AI Adaptive + ML Prediction (SSOT History compatible)"
mkdir -p src/services/ai src/services/ml src/hooks/useAI src/components/ai-insights src/pages/ai-dashboard

cat > src/services/ai/AdaptiveEngine.ts <<'TS'
import { historyService, WorkoutRecord } from "@/services/history/HistoryService";

export type AdaptiveRecommendation = {
  type: "warning" | "success" | "info" | "adjustment";
  title: string;
  message: string;
  action?: { label: string; href?: string };
};

export type PerformanceMetrics = {
  workoutFrequency7d: number;
  avgPSE7d: number;
  avgDurationMin7d: number;
  loadTrend14d: "up" | "down" | "stable";
  recoveryScore: number;
};

function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function getWorkoutsAll(limit = 9999): WorkoutRecord[] {
  const ws = (historyService as any).getWorkouts?.(limit) ?? [];
  return Array.isArray(ws) ? (ws as WorkoutRecord[]) : [];
}

function inRange(w: any, start: Date, end: Date) {
  const di = w.dateIso ?? w.date ?? w.startTime ?? w.endTime;
  if (!di) return false;
  const t = new Date(String(di)).getTime();
  return t >= start.getTime() && t <= end.getTime();
}

function durationMin(w: any): number {
  const v =
    w.durationMinutes ??
    w.durationMin ??
    (typeof w.durationSec === "number" ? Math.round(w.durationSec / 60) : undefined);
  return typeof v === "number" ? v : 0;
}

function pseVal(w: any): number | undefined {
  return typeof w.pse === "number" ? w.pse : undefined;
}

export class AdaptiveEngine {
  computeMetrics(now = new Date()): PerformanceMetrics {
    const end = now;
    const start7 = addDays(end, -6);
    const start14 = addDays(end, -13);

    const all = getWorkoutsAll(9999);
    const w7 = all.filter((w) => inRange(w, start7, end));
    const w14 = all.filter((w) => inRange(w, start14, end));

    const workoutFrequency7d = w7.length;

    const pseArr = w7.map(pseVal).filter((x): x is number => typeof x === "number");
    const avgPSE7d = pseArr.length ? pseArr.reduce((s, v) => s + v, 0) / pseArr.length : 0;

    const avgDurationMin7d = w7.length ? w7.reduce((s, w) => s + durationMin(w), 0) / w7.length : 0;

    const mid = addDays(end, -7);
    const wPrev = w14.filter((w) => inRange(w, start14, addDays(mid, -1)));
    const avgPrev = wPrev.length ? wPrev.reduce((s, w) => s + durationMin(w), 0) / wPrev.length : 0;
    const avgNow = w7.length ? w7.reduce((s, w) => s + durationMin(w), 0) / w7.length : 0;

    const loadTrend14d: "up" | "down" | "stable" =
      avgNow > avgPrev * 1.15 ? "up" : avgNow < avgPrev * 0.85 ? "down" : "stable";

    let recoveryScore = 85;
    if (workoutFrequency7d >= 6) recoveryScore -= 18;
    if (avgPSE7d >= 8) recoveryScore -= 18;
    if (avgPSE7d >= 6 && avgPSE7d < 8) recoveryScore -= 8;
    if (loadTrend14d == "up") recoveryScore -= 10;
    if (workoutFrequency7d <= 3) recoveryScore += 5;
    recoveryScore = Math.max(0, Math.min(100, Math.round(recoveryScore)));

    return {
      workoutFrequency7d,
      avgPSE7d: Math.round(avgPSE7d * 10) / 10,
      avgDurationMin7d: Math.round(avgDurationMin7d),
      loadTrend14d,
      recoveryScore,
    };
  }

  getRecommendations(now = new Date()): AdaptiveRecommendation[] {
    const m = this.computeMetrics(now);
    const recs: AdaptiveRecommendation[] = [];

    if (m.workoutFrequency7d == 0) {
      recs.push({
        type: "info",
        title: "Vamos voltar ao ritmo",
        message: "Nenhum treino nos últimos 7 dias. Que tal iniciar com um treino leve para retomar consistência?",
        action: { label: "Abrir Progress", href: "/progress" },
      });
      return recs;
    }

    if (m.recoveryScore <= 55) {
      recs.push({
        type: "warning",
        title: "Risco de fadiga acumulada",
        message: `Recuperação estimada: ${m.recoveryScore}/100. Sugestão: reduzir volume por 24–48h e priorizar sono/hidratação.`,
        action: { label: "Treino ao Vivo", href: "/live-workout" },
      });
    } else {
      recs.push({
        type: "success",
        title: "Boa consistência",
        message: `Recuperação estimada: ${m.recoveryScore}/100. Continue progredindo com atenção à técnica e regularidade.`,
      });
    }

    if (m.loadTrend14d == "up") {
      recs.push({
        type: "adjustment",
        title: "Carga em alta",
        message: "Sua carga média aumentou nas últimas 2 semanas. Considere um dia de descarga se aparecer queda de performance.",
      });
    }

    if (m.avgPSE7d >= 8) {
      recs.push({
        type: "warning",
        title: "Esforço muito alto",
        message: "A PSE média está elevada. Alternar dias fortes/leves ajuda a manter evolução e reduzir risco de overreaching.",
      });
    }

    return recs;
  }
}

export const adaptiveEngine = new AdaptiveEngine();
TS

cat > src/services/ml/PredictionEngine.ts <<'TS'
import { historyService, WorkoutRecord, WorkoutType } from "@/services/history/HistoryService";

export type WorkoutPrediction = {
  type: WorkoutType;
  suggestedDurationMin: number;
  suggestedCaloriesKcal: number;
  suggestedDistanceKm?: number;
  confidence01: number;
};

export type WeightPrediction = {
  slopeKgPerDay: number;
  r2: number;
  projectedKg7d?: number;
  projectedKg30d?: number;
};

function getAllWorkouts(): WorkoutRecord[] {
  const ws = (historyService as any).getWorkouts?.(9999) ?? [];
  return Array.isArray(ws) ? (ws as WorkoutRecord[]) : [];
}

function durationMin(w: any): number {
  const v =
    w.durationMinutes ??
    w.durationMin ??
    (typeof w.durationSec === "number" ? Math.round(w.durationSec / 60) : undefined);
  return typeof v === "number" ? v : 0;
}

function caloriesKcal(w: any): number {
  const v = w.caloriesBurned ?? w.caloriesKcal;
  return typeof v === "number" ? v : 0;
}

function distanceKm(w: any): number | undefined {
  const m = w.distanceMeters;
  if (typeof m === "number" && m > 0) return Math.round((m / 1000) * 100) / 100;
  const km = w.distanceKm;
  if (typeof km === "number" && km > 0) return Math.round(km * 100) / 100;
  return undefined;
}

export class PredictionEngine {
  predictWorkout(type: WorkoutType, targetDistanceKm?: number): WorkoutPrediction {
    const all = getAllWorkouts();
    const hist = all.filter((w: any) => (w.type ?? w.modality) === type);

    const n = hist.length;
    const conf = Math.min(0.9, Math.max(0.25, n / 20));

    const avgDur = n ? hist.reduce((s, w) => s + durationMin(w), 0) / n : this.getDefaultDuration(type);
    const avgCal = n ? hist.reduce((s, w) => s + caloriesKcal(w), 0) / n : this.getDefaultCalories(type);

    let suggestedDistanceKm: number | undefined = undefined;
    if (type === "corrida" || type === "ciclismo") {
      if (typeof targetDistanceKm === "number" && targetDistanceKm > 0) suggestedDistanceKm = targetDistanceKm;
      else {
        const d = hist.map(distanceKm).filter((x): x is number => typeof x === "number");
        if (d.length) suggestedDistanceKm = d.sort((a, b) => a - b)[Math.floor(d.length * 0.6)];
      }
    }

    let suggestedDurationMin = Math.round(avgDur);
    if (suggestedDistanceKm && (type === "corrida" || type === "ciclismo")) {
      const d = hist.map(distanceKm).filter((x): x is number => typeof x === "number");
      const med = d.length ? d.sort((a, b) => a - b)[Math.floor(d.length / 2)] : undefined;
      if (med && med > 0 && suggestedDistanceKm > med) suggestedDurationMin = Math.round(avgDur * (suggestedDistanceKm / med));
    }

    return { type, suggestedDurationMin, suggestedCaloriesKcal: Math.round(avgCal), suggestedDistanceKm, confidence01: Math.round(conf * 100) / 100 };
  }

  predictWeight(): WeightPrediction {
    const data = (historyService as any).getWeightProgress?.() ?? [];
    if (!Array.isArray(data) || data.length < 2) return { slopeKgPerDay: 0, r2: 0 };

    const pts = data
      .map((d: any) => ({ dateIso: d.dateIso ?? d.date, weightKg: d.weightKg ?? d.weight }))
      .filter((d: any) => d.dateIso && typeof d.weightKg === "number");

    if (pts.length < 2) return { slopeKgPerDay: 0, r2: 0 };

    const t0 = new Date(pts[0].dateIso).getTime();
    const xs = pts.map((d: any) => (new Date(d.dateIso).getTime() - t0) / (1000 * 60 * 60 * 24));
    const ys = pts.map((d: any) => d.weightKg);

    const n = xs.length;
    const meanX = xs.reduce((s: number, v: number) => s + v, 0) / n;
    const meanY = ys.reduce((s: number, v: number) => s + v, 0) / n;

    let num = 0.0, den = 0.0;
    for (let i = 0; i < n; i++) { num += (xs[i] - meanX) * (ys[i] - meanY); den += (xs[i] - meanX) * (xs[i] - meanX); }
    const m = den === 0 ? 0 : num / den;
    const b = meanY - m * meanX;

    const yhat = (x: number) => m * x + b;
    const ssTot = ys.reduce((s: number, y: number) => s + Math.pow(y - meanY, 2), 0);
    const ssRes = ys.reduce((s: number, y: number, i: number) => s + Math.pow(y - yhat(xs[i]), 2), 0);
    const r2 = ssTot == 0 ? 0 : Math.max(0, Math.min(1, 1 - ssRes / ssTot));

    const proj7 = yhat(xs[xs.length - 1] + 7);
    const proj30 = yhat(xs[xs.length - 1] + 30);

    return { slopeKgPerDay: Math.round(m * 1000) / 1000, r2: Math.round(r2 * 100) / 100, projectedKg7d: Math.round(proj7 * 10) / 10, projectedKg30d: Math.round(proj30 * 10) / 10 };
  }
}

export const predictionEngine = new PredictionEngine();
TS

cat > src/hooks/useAI/useAI.ts <<'TS'
import { useEffect, useMemo, useState } from "react";
import { adaptiveEngine, AdaptiveRecommendation, PerformanceMetrics } from "@/services/ai/AdaptiveEngine";
import { predictionEngine, WorkoutPrediction, WeightPrediction } from "@/services/ml/PredictionEngine";
import { WorkoutType } from "@/services/history/HistoryService";

export function useAI() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>(() => adaptiveEngine.computeMetrics(new Date()));
  const [recs, setRecs] = useState<AdaptiveRecommendation[]>(() => adaptiveEngine.getRecommendations(new Date()));
  const [weightPred, setWeightPred] = useState<WeightPrediction>(() => predictionEngine.predictWeight());

  useEffect(() => {
    const now = new Date();
    setMetrics(adaptiveEngine.computeMetrics(now));
    setRecs(adaptiveEngine.getRecommendations(now));
    setWeightPred(predictionEngine.predictWeight());
  }, []);

  const predictWorkout = (type: WorkoutType, distanceKm?: number): WorkoutPrediction =>
    predictionEngine.predictWorkout(type, distanceKm);

  const bestHour = useMemo(() => ({
    corrida: { hour: 7, confidence01: 0.25 },
    musculacao: { hour: 7, confidence01: 0.25 },
    ciclismo: { hour: 7, confidence01: 0.25 },
  }), []);

  return { metrics, recs, weightPred, predictWorkout, bestHour };
}
TS

cat > src/components/ai-insights/AIInsights.tsx <<'TSX'
import { useAI } from "@/hooks/useAI/useAI";

function Badge({ t }: { t: string }) {
  return <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/80">{t}</span>;
}

export function AIInsights() {
  const { metrics, recs, weightPred } = useAI();

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
TSX

cat > src/pages/ai-dashboard/AIDashboardPage.tsx <<'TSX'
import { AIInsights } from "@/components/ai-insights/AIInsights";

export default function AIDashboardPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-2xl font-semibold">IA & Predições</div>
            <div className="text-sm text-white/60">Recomendações adaptativas e previsões (ML local-first).</div>
          </div>
          <a
            href="/progress"
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90 hover:bg-white/10"
          >
            Abrir Progress →
          </a>
        </div>

        <div className="mt-6">
          <AIInsights />
        </div>
      </div>
    </div>
  );
}
TSX

python3 - <<'PY'
from pathlib import Path
import re

f = Path("src/App.tsx")
s = f.read_text(encoding="utf-8")

if 'from "@/pages/ai-dashboard/AIDashboardPage"' not in s:
  lines = s.splitlines(True)
  last_import = 0
  for i, ln in enumerate(lines):
    if re.match(r'^\\s*import\\b', ln):
      last_import = i
  lines.insert(last_import+1, 'import AIDashboardPage from "@/pages/ai-dashboard/AIDashboardPage";\\n')
  s = "".join(lines)

if 'path="/ai"' not in s:
  if "</Routes>" in s:
    s = s.replace("</Routes>", '  <Route path="/ai" element={<AIDashboardPage />} />\\n</Routes>', 1)
  else:
    note = '\\n/* MF_NOTE: add route: <Route path="/ai" element={<AIDashboardPage />} /> */\\n'
    if "MF_NOTE: add route" not in s:
      s += note

f.write_text(s, encoding="utf-8")
print("OK: patched /ai route in src/App.tsx")
PY


## MF_AUTOHEAL_PREDICTIONENGINE_DEFAULTS_V1
python3 - <<'PY'
from pathlib import Path
import re

pe = Path('src/services/ml/PredictionEngine.ts')
if not pe.exists():
    raise SystemExit(0)

txt = pe.read_text(encoding='utf-8')
has_dur = 'getDefaultDuration' in txt
has_cal = 'getDefaultCalories' in txt
if has_dur and has_cal:
    raise SystemExit(0)

methods = '\n'.join([
  '  private getDefaultDuration(type: any): number {',
  '    switch (type) {',
  '      case "corrida": return 40;',
  '      case "ciclismo": return 50;',
  '      case "musculacao": return 55;',
  '      default: return 45;',
  '    }',
  '  }',
  '',
  '  private getDefaultCalories(type: any): number {',
  '    switch (type) {',
  '      case "corrida": return 380;',
  '      case "ciclismo": return 420;',
  '      case "musculacao": return 360;',
  '      default: return 350;',
  '    }',
  '  }',
])

pat = r'(export\s+class\s+PredictionEngine\s*\{)'
m = re.search(pat, txt)
if not m:
    raise SystemExit('❌ PredictionEngine class não encontrada')

out = txt[:m.end()] + '\n' + methods + '\n' + txt[m.end():]
pe.write_text(out, encoding='utf-8')
print('OK: auto-heal aplicou defaults no PredictionEngine')
PY



## MF_AUTOHEAL_PREDICTIONENGINE_DEFAULTS_V2
python3 - <<'PY'
from pathlib import Path
import re

pe = Path('src/services/ml/PredictionEngine.ts')
if not pe.exists():
  raise SystemExit(0)

txt = pe.read_text(encoding='utf-8')
has_dur = re.search(r'(?m)^\s*private\s+getDefaultDuration\s*\(', txt) is not None
has_cal = re.search(r'(?m)^\s*private\s+getDefaultCalories\s*\(', txt) is not None
if has_dur and has_cal:
  raise SystemExit(0)

methods = "\n".join([
  '  private getDefaultDuration(type: any): number {',
  '    switch (type) {',
  '      case "corrida": return 40;',
  '      case "ciclismo": return 50;',
  '      case "musculacao": return 55;',
  '      default: return 45;',
  '    }',
  '  }',
  '',
  '  private getDefaultCalories(type: any): number {',
  '    switch (type) {',
  '      case "corrida": return 380;',
  '      case "ciclismo": return 420;',
  '      case "musculacao": return 360;',
  '      default: return 350;',
  '    }',
  '  }',
])

pat = r'(export\s+class\s+PredictionEngine\s*\{)'
m = re.search(pat, txt)
if not m:
  raise SystemExit('❌ PredictionEngine class não encontrada')

out = txt[:m.end()] + "\n" + methods + "\n" + txt[m.end():]
pe.write_text(out, encoding='utf-8')
print('OK: AUTOHEAL V2 injetou defaults como private members')
PY


echo "==> typecheck + verify"
npx tsc --noEmit
npm run -s verify

git add -A
git commit -m "feat: phase 9 ai/ml (adaptive + prediction + ui + route)" || true
echo "✅ OK | Phase 9 done"