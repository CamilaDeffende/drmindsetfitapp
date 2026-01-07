import { tokens } from "../../ui/tokens";
import { useHistoryStore } from "../../store/useHistoryStore";
import { useProgressStore } from "../../store/useProgressStore";
import type { WorkoutSession, PR } from "../../contracts/workout";
import { buildTrends, buildInsight, formatKg, formatMin, formatPct, formatInt } from "../../utils/dashboard";

function todayYMD(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function flattenHistory(history: any): WorkoutSession[] {
  if (!history || typeof history !== "object") return [];
  // history: { [date]: WorkoutSession[] | LegacyWorkoutDay }
  const out: WorkoutSession[] = [];
  for (const k of Object.keys(history)) {
    const v = history[k];
    if (Array.isArray(v)) {
      out.push(...v);
    } else if (v && Array.isArray(v.workouts)) {
      out.push(...v.workouts);
    } else if (v && Array.isArray(v.sessions)) {
      out.push(...v.sessions);
    }
  }
  return out;
}

function toneBg(tone: "good" | "warn" | "neutral") {
  if (tone === "good") return "rgba(16,185,129,0.10)";
  if (tone === "warn") return "rgba(245,158,11,0.10)";
  return "rgba(59,130,246,0.10)";
}

export function DashboardPro() {
  // compat: sessions (novo) ou history (legado)
  const sessions = useHistoryStore((s: any) => (s.sessions ?? flattenHistory(s.history)) as WorkoutSession[]);
  const streak = useProgressStore((s) => s.streak);
  const prs = useProgressStore((s) => s.prs) as PR[];

  const latest = sessions.length
    ? [...sessions].sort((a, b) => String(b.finishedAt || b.startedAt || b.date).localeCompare(String(a.finishedAt || a.startedAt || a.date)))[0]
    : null;

  const t = buildTrends(sessions, todayYMD(), 7);
  const insight = buildInsight(t);

  const kpiA = [
    { label: "Streak", value: formatInt(streak), hint: "dias" },
    { label: "PRs", value: formatInt(prs?.length || 0), hint: "ativos" },
    { label: "Treinos (7d)", value: formatInt(t.current.workouts), hint: formatPct(t.workoutsDeltaPct) + " vs prev." },
  ];

  const kpiB = [
    { label: "Volume (7d)", value: formatKg(t.current.volumeKg), hint: formatPct(t.volumeDeltaPct) + " vs prev." },
    { label: "Intensidade", value: formatInt(t.current.avgIntensity), hint: formatPct(t.intensityDeltaPct) + " vs prev." },
    { label: "Duração média", value: formatMin(t.current.avgDurationMin), hint: "últimos 7d" },
  ];

  return (
    <div style={{ padding: 14, display: "grid", gap: 12 }}>
      {/* Header */}
      <div style={{
        borderRadius: tokens.radius.xl,
        border: "1px solid " + tokens.colors.border,
        background: tokens.colors.panel2,
        padding: 14
      }}>
        <div style={{ fontSize: 16, fontWeight: 1000 }}>Dashboard PRO</div>
        <div style={{ fontSize: 12, color: tokens.colors.muted, marginTop: 4 }}>
          KPIs • tendências • insight • ações rápidas
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
        {kpiA.map((k) => (
          <div key={k.label} style={{
            borderRadius: 18,
            border: "1px solid " + tokens.colors.border,
            background: tokens.colors.panel2,
            padding: 12
          }}>
            <div style={{ fontSize: 11, fontWeight: 950, color: tokens.colors.muted }}>{k.label}</div>
            <div style={{ fontSize: 18, fontWeight: 1100, marginTop: 6 }}>{k.value}</div>
            <div style={{ fontSize: 11, color: tokens.colors.muted, marginTop: 4 }}>{k.hint}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
        {kpiB.map((k) => (
          <div key={k.label} style={{
            borderRadius: 18,
            border: "1px solid " + tokens.colors.border,
            background: tokens.colors.panel2,
            padding: 12
          }}>
            <div style={{ fontSize: 11, fontWeight: 950, color: tokens.colors.muted }}>{k.label}</div>
            <div style={{ fontSize: 18, fontWeight: 1100, marginTop: 6 }}>{k.value}</div>
            <div style={{ fontSize: 11, color: tokens.colors.muted, marginTop: 4 }}>{k.hint}</div>
          </div>
        ))}
      </div>

      {/* Trends row (micro) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div style={{
          borderRadius: tokens.radius.xl,
          border: "1px solid " + tokens.colors.border,
          background: tokens.colors.panel2,
          padding: 14
        }}>
          <div style={{ fontSize: 12, fontWeight: 1000 }}>Tendência (7d)</div>
          <div style={{ fontSize: 12, color: tokens.colors.muted, marginTop: 6 }}>
            Volume: <span style={{ fontWeight: 1000 }}>{formatKg(t.current.volumeKg)}</span> ({formatPct(t.volumeDeltaPct)})
          </div>
          <div style={{ fontSize: 12, color: tokens.colors.muted, marginTop: 4 }}>
            Treinos: <span style={{ fontWeight: 1000 }}>{formatInt(t.current.workouts)}</span> ({formatPct(t.workoutsDeltaPct)})
          </div>
          <div style={{ fontSize: 12, color: tokens.colors.muted, marginTop: 4 }}>
            Intensidade: <span style={{ fontWeight: 1000 }}>{formatInt(t.current.avgIntensity)}</span> ({formatPct(t.intensityDeltaPct)})
          </div>
        </div>

        <div style={{
          borderRadius: tokens.radius.xl,
          border: "1px solid " + tokens.colors.border,
          background: toneBg(insight.tone),
          padding: 14
        }}>
          <div style={{ fontSize: 12, fontWeight: 1100 }}>{insight.title}</div>
          <div style={{ fontSize: 12, color: tokens.colors.muted, marginTop: 8 }}>
            {insight.body}
          </div>
        </div>
      </div>

      {/* Latest workout + CTAs */}
      <div style={{
        borderRadius: tokens.radius.xl,
        border: "1px solid " + tokens.colors.border,
        background: tokens.colors.panel2,
        padding: 14,
        display: "grid",
        gap: 10
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 1000 }}>Último treino</div>
          <div style={{ fontSize: 11, color: tokens.colors.muted }}>{latest?.date || "—"}</div>
        </div>

        <div style={{ fontSize: 12, color: tokens.colors.muted }}>
          {latest
            ? `${latest.exercises?.length || 0} exercícios • ${latest.setsTotal || 0} sets • ${Math.round(latest.volumeTotal || 0)} kg`
            : "Sem treinos salvos ainda. Faça seu primeiro treino para liberar métricas."}
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <a href="#/workout" style={btnPrimary}>Iniciar treino</a>
          <a href="#/history" style={btnGhost}>Ver histórico</a>
          <a href="#/report" style={btnGhost}>Gerar relatório</a>
        </div>
      </div>
    </div>
  );
}

const btnPrimary: React.CSSProperties = {
  flex: 1,
  textAlign: "center",
  textDecoration: "none",
  borderRadius: 16,
  border: "1px solid #1F2937",
  background: "#0A84FF",
  color: "#001018",
  padding: 12,
  fontWeight: 1100,
};

const btnGhost: React.CSSProperties = {
  flex: 1,
  textAlign: "center",
  textDecoration: "none",
  borderRadius: 16,
  border: "1px solid #1F2937",
  background: "#111827",
  color: "#E5E7EB",
  padding: 12,
  fontWeight: 1000,
};
