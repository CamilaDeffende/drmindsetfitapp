import React from "react";
import { tokens } from "../../ui/tokens";
import { useWorkoutStore } from "../../store/useWorkoutStore";
import { useHistoryStore } from "../../store/useHistoryStore";
import { useProgressStore } from "../../store/useProgressStore";
export function WorkoutBuilder() {
  const { workout, addExercise: _addExercise, removeExercise, addSet, updateSet, updateNotes, reset  } = useWorkoutStore();
  const selectedDate = useHistoryStore(s => s.selectedDate);
  const saveWorkout = useHistoryStore(s => s.saveWorkout);

  
  const updateStreak = useProgressStore(s => s.updateStreak);
  const addExercise = (name: string, muscle: any) => {
    _addExercise(name, muscle);
    updateStreak(new Date().toISOString());
  };
return (
    <div style={{ padding: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 950 }}>Workout Builder</div>
          <div style={{ fontSize: 12, color: tokens.colors.muted }}>Séries • reps • carga • RPE • descanso</div>
        </div>
        <button onClick={reset} style={{
          borderRadius: 16, border: "1px solid " + tokens.colors.border,
          background: tokens.colors.panel2, color: tokens.colors.text,
          padding: "10px 12px", fontWeight: 1000, cursor: "pointer"
        }}>Limpar</button>
        <button
          onClick={() => {
            saveWorkout({
              date: selectedDate,
              exercises: workout.map(ex => ({
                name: ex.name,
                muscle: ex.muscle,
                sets: ex.sets.map(s => ({ reps: s.reps, load: s.load }))
              }))
            });
          }}
          style={{
            borderRadius: 16,
            border: "1px solid " + tokens.colors.border,
            background: tokens.colors.blue,
            color: "#001018",
            padding: "10px 12px",
            fontWeight: 1000,
            cursor: "pointer"
          }}
        >
          Salvar treino
        </button>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
        <button onClick={() => addExercise("Bench Press", "Chest")} style={btnPrimary}>+ Adicionar exercício</button>
        <button onClick={() => addExercise("Lat Pulldown", "Back")} style={btnGhost}>+ Costas</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10, marginTop: 12 }}>
        {workout.map(ex => (
          <div key={ex.id} style={{
            borderRadius: tokens.radius.xl, border: "1px solid " + tokens.colors.border,
            background: tokens.colors.panel2, padding: 14
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
              <div>
                <div style={{ fontWeight: 1000 }}>{ex.name}</div>
                <div style={{ fontSize: 12, color: tokens.colors.muted }}>{ex.muscle}</div>
              </div>
              <button onClick={() => removeExercise(ex.id)} style={{
                borderRadius: 14, border: "1px solid " + tokens.colors.border,
                background: tokens.colors.panel, color: tokens.colors.text,
                padding: "8px 10px", fontWeight: 1000, cursor: "pointer"
              }}>Remover</button>
            </div>

            <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
              <div style={hdr}>Set</div><div style={hdr}>Reps</div><div style={hdr}>Carga</div><div style={hdr}>Desc(s)</div>
              {ex.sets.map((s, i) => (
                <React.Fragment key={i}>
                  <div style={cell}>{i+1}</div>
                  <input style={inp} type="number" value={s.reps} onChange={(e) => updateSet(ex.id, i, { reps: Number(e.target.value) })} />
                  <input style={inp} type="number" value={s.load} onChange={(e) => updateSet(ex.id, i, { load: Number(e.target.value) })} />
                  <input style={inp} type="number" value={s.restSec ?? 90} onChange={(e) => updateSet(ex.id, i, { restSec: Number(e.target.value) })} />
                </React.Fragment>
              ))}
            </div>

            <button onClick={() => addSet(ex.id)} style={{ ...btnGhost, marginTop: 10 }}>+ Adicionar set</button>

            <textarea
              value={ex.notes ?? ""}
              onChange={(e) => updateNotes(ex.id, e.target.value)}
              placeholder="Notas do exercício (técnica, sensação, ajustes...)"
              style={{
                marginTop: 10, width: "100%", minHeight: 64,
                borderRadius: 16, border: "1px solid " + tokens.colors.border,
                background: tokens.colors.panel, color: tokens.colors.text,
                padding: 12, outline: "none", fontWeight: 700, fontSize: 12
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

const btnPrimary: React.CSSProperties = {
  flex: 1, borderRadius: 16, border: "1px solid #1F2937",
  background: "#0A84FF", color: "#001018", padding: 12, fontWeight: 1000, cursor: "pointer"
};
const btnGhost: React.CSSProperties = {
  borderRadius: 16, border: "1px solid #1F2937",
  background: "#111827", color: "#E5E7EB", padding: 12, fontWeight: 1000, cursor: "pointer"
};

const hdr: React.CSSProperties = { fontSize: 11, fontWeight: 950, color: "#9CA3AF" };
const cell: React.CSSProperties = { fontSize: 12, fontWeight: 900, color: "#E5E7EB", display: "grid", placeItems: "center" };
const inp: React.CSSProperties = {
  width: "100%", borderRadius: 12, border: "1px solid #1F2937",
  background: "#0F172A", color: "#E5E7EB", padding: "10px 10px", outline: "none", fontWeight: 900
};

