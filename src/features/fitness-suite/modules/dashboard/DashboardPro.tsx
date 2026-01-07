import { useState, useEffect, useMemo } from "react";
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
  const streak = useProgressStore((s: any) => s.streak);
  const prs = useProgressStore((s: any) => s.prs) as PR[];

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


  // === Sprint 10.5 | Meta da Semana ===

  const [weeklyGoal, setWeeklyGoal] = useState<number>(4);


  useEffect(() => {

    try {

      const raw = window.localStorage.getItem("dmf_weekly_goal_v1");

      const n = raw ? Number(raw) : NaN;

      if (Number.isFinite(n) && n >= 1 && n <= 14) setWeeklyGoal(n);

    } catch {}

  }, []);


  useEffect(() => {

    try {

      window.localStorage.setItem("dmf_weekly_goal_v1", String(weeklyGoal));

    } catch {}

  }, [weeklyGoal]);


  // compat: sessions pode estar em sessões canon ou legado

  const weeklySessions = useHistoryStore((st: any) => (

    st?.sessions ?? st?.legacySessions ?? st?.items ?? st?.history ?? []

  )) as any[];


  const weekly = useMemo(() => {

    const sessions = weeklySessions;

    const now = new Date();

    const day = now.getDay(); // 0 dom ... 6 sáb

    const diffToMon = (day + 6) % 7;

    const start = new Date(now);

    start.setHours(0,0,0,0);

    start.setDate(start.getDate() - diffToMon);


    const end = new Date(start);

    end.setDate(end.getDate() + 7);


    const prevStart = new Date(start);

    prevStart.setDate(prevStart.getDate() - 7);


    const prevEnd = new Date(start);


    const toTime = (d: any) => (d instanceof Date ? d.getTime() : new Date(d).getTime());

    const inRange = (t: number, a: number, b: number) => t >= a && t < b;


    const startT = start.getTime();

    const endT = end.getTime();

    const prevStartT = prevStart.getTime();

    const prevEndT = prevEnd.getTime();


    let thisWeek = 0;

    let lastWeek = 0;


    for (const sess of sessions) {

      const t = toTime(sess?.date || sess?.createdAt || sess?.startAt || sess?.performedAt || sess?.endedAt || 0);

      if (!Number.isFinite(t) || t <= 0) continue;

      if (inRange(t, startT, endT)) thisWeek++;

      else if (inRange(t, prevStartT, prevEndT)) lastWeek++;

    }


    const pct = weeklyGoal > 0 ? Math.min(100, Math.round((thisWeek / weeklyGoal) * 100)) : 0;

    return { thisWeek, lastWeek, pct };

  }, [weeklySessions, weeklyGoal]);


  const incGoal = () => setWeeklyGoal((g) => Math.min(14, g + 1));

  const decGoal = () => setWeeklyGoal((g) => Math.max(1, g - 1));

  // === /Sprint 10.5 | Meta da Semana ===

  // === Sprint 10.6 | Badges & Milestones ===
  const streakDays = useProgressStore((s: any) => s.streak) as number;
  const prsCount = useProgressStore((s: any) => (s.prs || []).length) as number;

  // weeklySessions vem do Sprint 10.5 (compat legacy)
  const totalSessions = (weeklySessions || []).length;

  type Badge = {
    id: string;
    label: string;
    hint: string;
    earned: boolean;
  };

  const badges = useMemo<Badge[]>(() => {
    const list: Badge[] = [
      { id: "first", label: "Primeiro treino", hint: "Complete 1 treino", earned: totalSessions >= 1 },
      { id: "s3", label: "Streak 3", hint: "3 dias seguidos", earned: streakDays >= 3 },
      { id: "s7", label: "Streak 7", hint: "7 dias seguidos", earned: streakDays >= 7 },
      { id: "s14", label: "Streak 14", hint: "14 dias seguidos", earned: streakDays >= 14 },
      { id: "s30", label: "Streak 30", hint: "30 dias seguidos", earned: streakDays >= 30 },

      { id: "pr1", label: "PR Starter", hint: "1 PR registrado", earned: prsCount >= 1 },
      { id: "pr5", label: "PR x5", hint: "5 PRs registrados", earned: prsCount >= 5 },
      { id: "pr10", label: "PR x10", hint: "10 PRs registrados", earned: prsCount >= 10 },
      { id: "pr20", label: "PR x20", hint: "20 PRs registrados", earned: prsCount >= 20 },
    ];

    // mantém ordem e evita “excesso” visual: retorna todos, mas UI pode colapsar depois se quiser
    return list;
  }, [streakDays, prsCount, totalSessions]);

  const badgesEarned = useMemo(() => badges.filter((b) => b.earned).length, [badges]);
  // === /Sprint 10.6 | Badges & Milestones ===



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

          {/* Sprint 10.5 | Meta da Semana */}
          <div className="rounded-2xl border bg-white/5 p-4 backdrop-blur supports-[backdrop-filter]:bg-white/5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[12px] uppercase tracking-wide text-white/60">Meta da semana</div>
                <div className="mt-1 flex items-baseline gap-2">
                  <div className="text-3xl font-semibold leading-none">{weekly.thisWeek}</div>
                  <div className="text-[14px] text-white/60">/ {weeklyGoal} treinos</div>
                </div>
                <div className="mt-2 text-[12px] text-white/60">
                  Semana anterior: <span className="text-white/80 font-medium">{weekly.lastWeek}</span>
                  <span className="mx-2 text-white/30">•</span>
                  Progresso: <span className="text-white/80 font-medium">{weekly.pct}%</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={decGoal}
                  className="h-10 w-10 rounded-xl border border-white/10 bg-white/5 text-white/90 hover:bg-white/10 active:scale-[0.98] transition"
                  aria-label="Diminuir meta semanal">−</button>
                <button type="button" onClick={incGoal}
                  className="h-10 w-10 rounded-xl border border-white/10 bg-white/5 text-white/90 hover:bg-white/10 active:scale-[0.98] transition"
                  aria-label="Aumentar meta semanal">+</button>
              </div>
            </div>
            <div className="mt-4 h-2 w-full rounded-full bg-white/10">
              <div className="h-2 rounded-full bg-white/60 transition-all" style={{ width: weekly.pct + "%" }} />
            </div>
            <div className="mt-3 text-[12px] text-white/50">Ajuste rápido: meta fica salva neste dispositivo.</div>
          </div>
          {/* /Sprint 10.5 */}

        {/* Sprint 10.6 | Badges & Milestones */}
        <div className="rounded-2xl border bg-white/5 p-4 backdrop-blur supports-[backdrop-filter]:bg-white/5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[12px] uppercase tracking-wide text-white/60">Badges</div>
              <div className="mt-1 text-[14px] text-white/80">
                <span className="font-semibold text-white">{badgesEarned}</span>
                <span className="text-white/50"> / {badges.length}</span>
                <span className="mx-2 text-white/20">•</span>
                <span className="text-white/60">marcos reais de consistência e PR</span>
              </div>
            </div>

            <div className="text-right">
              <div className="text-[12px] text-white/50">Próximo foco</div>
              <div className="text-[13px] text-white/80">
                {badges.find((b) => !b.earned)?.hint ?? "Tudo concluído"}
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {badges.map((b) => (
              <span
                key={b.id}
                title={b.hint}
                className={
                  "inline-flex items-center rounded-full border px-3 py-1 text-[12px] transition " +
                  (b.earned
                    ? "border-white/15 bg-white/10 text-white/90"
                    : "border-white/10 bg-white/5 text-white/55")
                }
              >
                <span className={"mr-2 h-2 w-2 rounded-full " + (b.earned ? "bg-white/70" : "bg-white/25")} />
                {b.label}
              </span>
            ))}
          </div>

          <div className="mt-3 text-[12px] text-white/50">
            Dica: consistência + PRs = progresso mensurável. Sem “motivação vazia”.
          </div>
        </div>
        {/* /Sprint 10.6 */}



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
