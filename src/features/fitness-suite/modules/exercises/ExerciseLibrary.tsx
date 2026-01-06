import { useEffect, useMemo, useState } from "react";
import { tokens } from "../../ui/tokens";
import { exercises, Exercise } from "../../data/exercises";
import { ExerciseDetails } from "./ExerciseDetails";
import { useWorkoutStore } from "../../store/useWorkoutStore";
import { useUIStore } from "../../store/useUIStore";

export function ExerciseLibrary() {
  const [q, setQ] = useState("");
  const [focus, setFocus] = useState<Exercise["primary"] | "All">("All");
  const [selected, setSelected] = useState<Exercise | null>(null);

  const selectedMuscle = useUIStore(s => s.selectedMuscle);
  const addExercise = useWorkoutStore(s => s.addExercise);

  useEffect(() => {
    if (!selectedMuscle) return;
    const allowed = new Set([
      "Chest","Back","Shoulders","Biceps","Triceps",
      "Legs","Glutes","Core","Full Body"
    ]);
    setFocus(allowed.has(selectedMuscle as any) ? (selectedMuscle as any) : "All");
  }, [selectedMuscle]);

  const list = useMemo(() => {
    return exercises.filter(e => {
      const okQ = e.name.toLowerCase().includes(q.toLowerCase());
      const okF = focus === "All" ? true : e.primary === focus;
      return okQ && okF;
    });
  }, [q, focus]);

  if (selected) {
    return (
      <ExerciseDetails
        exercise={selected}
        onBack={() => setSelected(null)}
        onAdd={(ex) => addExercise(ex.name, ex.primary, ex.id)}
      />
    );
  }

  const groups: Array<Exercise["primary"] | "All"> = [
    "All","Chest","Back","Shoulders","Biceps",
    "Triceps","Legs","Glutes","Core","Full Body"
  ];

  return (
    <div style={{ padding: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 950 }}>Exercise Library</div>
          <div style={{ fontSize: 12, color: tokens.colors.muted }}>
            Busca + filtros automáticos
          </div>
        </div>

        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar exercício..."
          style={{
            width: 180,
            borderRadius: 14,
            border: "1px solid " + tokens.colors.border,
            padding: "10px",
            background: tokens.colors.panel2,
            color: tokens.colors.text,
            outline: "none",
            fontWeight: 900,
            fontSize: 12
          }}
        />
      </div>

      <div style={{ display: "flex", gap: 8, overflowX: "auto", marginTop: 12 }}>
        {groups.map(g => (
          <button
            key={g}
            onClick={() => setFocus(g)}
            style={{
              whiteSpace: "nowrap",
              borderRadius: 999,
              border: "1px solid " + tokens.colors.border,
              background: focus === g ? tokens.colors.blue : tokens.colors.panel2,
              color: focus === g ? "#001018" : tokens.colors.text,
              padding: "8px 10px",
              fontSize: 12,
              fontWeight: 1000,
              cursor: "pointer"
            }}
          >
            {g}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10, marginTop: 12 }}>
        {list.map(e => (
          <button
            key={e.id}
            onClick={() => setSelected(e)}
            style={{
              textAlign: "left",
              borderRadius: tokens.radius.xl,
              border: "1px solid " + tokens.colors.border,
              background: tokens.colors.panel2,
              padding: 12,
              cursor: "pointer"
            }}
          >
            <div style={{ fontWeight: 1000, fontSize: 14 }}>{e.name}</div>
            <div style={{ marginTop: 6, display: "flex", gap: 6, flexWrap: "wrap", fontSize: 11 }}>
              <span style={{ fontWeight: 1000, color: tokens.colors.blue }}>{e.primary}</span>
              <span style={{ color: tokens.colors.muted }}>{e.location}</span>
              <span style={{ color: tokens.colors.muted }}>{e.level}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
