import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { tokens } from "../../ui/tokens";
import { weeklyProgress, volumeTrend } from "../../data/progress";

export function ProgressDashboard() {
  const totalSessions = weeklyProgress.reduce((a, b) => a + b.sessions, 0);
  const totalVolume = weeklyProgress.reduce((a, b) => a + b.volume, 0);

  return (
    <div style={{ padding: 14 }}>
      <div>
        <div style={{ fontSize: 16, fontWeight: 950 }}>Progress</div>
        <div style={{ fontSize: 12, color: tokens.colors.muted }}>Cards + gráficos avançados</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10, marginTop: 12 }}>
        <KPI title="Sessões (semana)" value={String(totalSessions)} hint="Treinos concluídos" />
        <KPI title="Volume (semana)" value={String(totalVolume)} hint="Total estimado (kg)" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10, marginTop: 12 }}>
        <Panel title="Treinos por dia (barras)">
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyProgress}>
                <XAxis dataKey="day" stroke={tokens.colors.muted} />
                <YAxis stroke={tokens.colors.muted} />
                <Tooltip />
                <Bar dataKey="sessions" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Volume semanal (linha)">
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={volumeTrend}>
                <XAxis dataKey="week" stroke={tokens.colors.muted} />
                <YAxis stroke={tokens.colors.muted} />
                <Tooltip />
                <Line type="monotone" dataKey="volume" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function KPI({ title, value, hint }: { title: string; value: string; hint: string }) {
  return (
    <div style={{
      borderRadius: tokens.radius.xl,
      border: "1px solid " + tokens.colors.border,
      background: tokens.colors.panel2,
      padding: 14
    }}>
      <div style={{ fontSize: 11, color: tokens.colors.muted, fontWeight: 950 }}>{title}</div>
      <div style={{ fontSize: 44, fontWeight: 1000, marginTop: 6 }}>{value}</div>
      <div style={{ fontSize: 12, color: tokens.colors.muted, marginTop: 2 }}>{hint}</div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      borderRadius: tokens.radius.xl,
      border: "1px solid " + tokens.colors.border,
      background: tokens.colors.panel2,
      padding: 14
    }}>
      <div style={{ fontWeight: 1000, marginBottom: 8 }}>{title}</div>
      {children}
    </div>
  );
}
