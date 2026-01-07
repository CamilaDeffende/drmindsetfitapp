import { useMemo } from "react";
import { useHistoryStore } from "../../store/useHistoryStore";
import { tokens } from "../../ui/tokens";

function round(n: number) {
  return Math.round(n * 10) / 10;
}

export function HistoryPanel() {
  const selectedDate = useHistoryStore(s => s.selectedDate);
  const history = useHistoryStore(s => s.history);

  const workout = history[selectedDate];

  const summary = useMemo(() => {
    if (!workout) return { exercises: 0, sets: 0, volume: 0 };

    let sets = 0;
    let volume = 0;

    for (const ex of workout.exercises) {
      for (const st of ex.sets) {
        sets += 1;
        volume += (Number(st.load) || 0) * (Number(st.reps) || 0);
      }
    }
    return { exercises: workout.exercises.length, sets, volume: round(volume) };
  }, [workout]);

  return (
    <div style={{
      marginTop: 12,
      padding: 14,
      borderRadius: tokens.radius.xl,
      border: "1px solid " + tokens.colors.border,
      background: tokens.colors.panel
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 950 }}>Histórico</div>
          <div style={{ fontSize: 12, color: tokens.colors.muted }}>
            Data selecionada: <b style={{ color: tokens.colors.text }}>{selectedDate}</b>
          </div>
        </div>

        <div style={{
          display: "flex",
          gap: 8
        }}>
          <div style={pill}>Ex: {summary.exercises}</div>
          <div style={pill}>Sets: {summary.sets}</div>
          <div style={pill}>Vol: {summary.volume}</div>
        </div>
      </div>

      {!workout ? (
        <div style={{
          marginTop: 12,
          padding: 14,
          borderRadius: 16,
          border: "1px dashed " + tokens.colors.border,
          color: tokens.colors.muted,
          fontSize: 12,
          fontWeight: 800
        }}>
          Nenhum treino salvo para essa data ainda.
          <div style={{ marginTop: 6, fontWeight: 700 }}>
            Em breve: botão “Salvar treino” no Workout Builder.
          </div>
        </div>
      ) : (
        <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
          {workout.exercises.map((ex, idx) => (
            <div key={idx} style={{
              borderRadius: 18,
              border: "1px solid " + tokens.colors.border,
              background: tokens.colors.panel2,
              padding: 12
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <div>
                  <div style={{ fontWeight: 1000 }}>{ex.name}</div>
                  <div style={{ fontSize: 12, color: tokens.colors.muted }}>{ex.muscle}</div>
                </div>
                <div style={{ fontSize: 12, fontWeight: 950, color: tokens.colors.muted }}>
                  {ex.sets.length} sets
                </div>
              </div>

              <div style={{
                marginTop: 10,
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 8
              }}>
                <div style={hdr}>Set</div>
                <div style={hdr}>Reps</div>
                <div style={hdr}>Carga</div>

                {ex.sets.map((st, i) => (
                  <>
                    <div key={i + "-a"} style={cell}>{i + 1}</div>
                    <div key={i + "-b"} style={cell}>{st.reps}</div>
                    <div key={i + "-c"} style={cell}>{st.load}</div>
                  </>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const pill: React.CSSProperties = {
  padding: "8px 10px",
  borderRadius: 14,
  border: "1px solid " + tokens.colors.border,
  background: tokens.colors.panel2,
  fontSize: 12,
  fontWeight: 1000,
  color: tokens.colors.text
};

const hdr: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 950,
  color: "#9CA3AF"
};

const cell: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 900,
  color: "#E5E7EB",
  display: "grid",
  placeItems: "center",
  padding: "10px 8px",
  borderRadius: 12,
  border: "1px solid #1F2937",
  background: "#0F172A"
};
