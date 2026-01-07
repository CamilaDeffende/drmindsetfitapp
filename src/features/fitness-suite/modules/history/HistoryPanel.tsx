import { tokens } from "../../ui/tokens";
import { useHistoryStore } from "../../store/useHistoryStore";
import { useProgressStore } from "../../store/useProgressStore";
import { WorkoutSession } from "../../contracts/workout";

function formatDateBR(iso: string) {
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

function isSameDay(a: string, b: string) {
  return a.slice(0, 10) === b.slice(0, 10);
}

function minutesBetween(startIso: string, endIso: string) {
  const a = Date.parse(startIso);
  const b = Date.parse(endIso);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 0;
  const diff = Math.max(0, b - a);
  return Math.round(diff / 60000);
}

function safeDurationMin(w: any): number {
  // 1) se existir durationMin
  if (typeof w?.durationMin === "number") return w.durationMin;

  // 2) se existir durationSec
  if (typeof w?.durationSec === "number") return Math.round(w.durationSec / 60);

  // 3) calcula por startedAt/finishedAt
  if (typeof w?.startedAt === "string" && typeof w?.finishedAt === "string") {
    return minutesBetween(w.startedAt, w.finishedAt);
  }

  return 0;
}

export function HistoryPanel() {
  // store (compat)
  const history = useHistoryStore((s: any) => s.history);
  const sessions = useHistoryStore((s: any) => s.sessions);
  const selectedDate = useHistoryStore((s: any) => s.selectedDate);
  const selectDate = useHistoryStore((s: any) => s.selectDate);

  const streak = useProgressStore((p: any) => p.streak);
  const prs = useProgressStore((p: any) => p.prs);
  const prsToday = (prs || []).filter((pr: any) => isSameDay(pr.date, selectedDate)).length;

  // Preferir sessions (novo). Se não existir, tentar converter legado do dia.
  let workouts: WorkoutSession[] = [];

  if (Array.isArray(sessions)) {
    workouts = sessions.filter((w: any) => (w?.date ?? "").slice(0, 10) === selectedDate);
  } else {
    const legacyDay = history?.[selectedDate];
    // Se o legado já for array, usa direto
    if (Array.isArray(legacyDay)) {
      workouts = legacyDay as WorkoutSession[];
    } else if (legacyDay && typeof legacyDay === "object") {
      // Converter legado (mínimo para render)
      const legacyList: any[] = Array.isArray(legacyDay.workouts) ? legacyDay.workouts : [];
      workouts = legacyList.map((w, i) => ({
        id: w?.id ?? `legacy_${selectedDate}_${i}`,
        date: selectedDate,
        startedAt: w?.startedAt ?? new Date().toISOString(),
        finishedAt: w?.finishedAt ?? new Date().toISOString(),
        exercises: Array.isArray(w?.exercises) ? w.exercises : [],
        volumeTotal: typeof w?.volumeTotal === "number" ? w.volumeTotal : 0,
        setsTotal: typeof w?.setsTotal === "number" ? w.setsTotal : 0,
        repsTotal: typeof w?.repsTotal === "number" ? w.repsTotal : 0,
        intensityScore: typeof w?.intensityScore === "number" ? w.intensityScore : 0,
      })) as WorkoutSession[];
    }
  }

  return (
    <div
      style={{
        marginTop: 12,
        padding: 14,
        borderRadius: tokens.radius.xl,
        border: "1px solid " + tokens.colors.border,
        background: tokens.colors.panel,
      }}
    >
      {/* Day View PRO */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          gap: 10,
          marginBottom: 14,
        }}
      >
        <div>
          <div style={{ fontSize: 18, fontWeight: 1000 }}>Dia</div>
          <div style={{ fontSize: 12, color: tokens.colors.muted }}>
            {formatDateBR(selectedDate)} • histórico de treino
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <span
            style={{
              borderRadius: 999,
              border: "1px solid " + tokens.colors.border,
              background: tokens.colors.panel2,
              padding: "8px 10px",
              fontSize: 12,
              fontWeight: 900,
              color: tokens.colors.text,
            }}
          >
            🔥 Streak: {streak}
          </span>

          <span
            style={{
              borderRadius: 999,
              border: "1px solid " + tokens.colors.border,
              background: tokens.colors.panel2,
              padding: "8px 10px",
              fontSize: 12,
              fontWeight: 900,
              color: tokens.colors.text,
            }}
          >
            🏆 PRs: {prsToday}
          </span>

          <button
            onClick={() => selectDate(new Date().toISOString().slice(0, 10))}
            style={{
              borderRadius: 14,
              border: "1px solid " + tokens.colors.border,
              background: tokens.colors.panel2,
              padding: "8px 12px",
              fontWeight: 900,
              color: tokens.colors.text,
              cursor: "pointer",
            }}
          >
            Hoje
          </button>
        </div>
      </div>

      {/* Workouts */}
      {workouts.length === 0 && (
        <div style={{ fontSize: 12, color: tokens.colors.muted }}>
          Nenhum treino registrado neste dia.
        </div>
      )}

      <div style={{ display: "grid", gap: 10 }}>
        {workouts.map((w) => (
          <div
            key={w.id}
            style={{
              borderRadius: tokens.radius.lg,
              border: "1px solid " + tokens.colors.border,
              background: tokens.colors.panel2,
              padding: 12,
            }}
          >
            <div style={{ fontWeight: 900, color: tokens.colors.text }}>
              {w.exercises?.length ?? 0} exercícios • {w.setsTotal} sets • {w.volumeTotal} kg
            </div>

            <div style={{ fontSize: 12, color: tokens.colors.muted }}>
              Duração: {safeDurationMin(w)} min • Reps: {w.repsTotal}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
