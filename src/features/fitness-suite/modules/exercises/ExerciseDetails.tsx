import type { Exercise } from "../../data/exercises";
import { tokens } from "../../ui/tokens";

export function ExerciseDetails({ exercise, onBack, onAdd }: {
  exercise: Exercise;
  onBack: () => void;
  onAdd: (ex: Exercise) => void;
}) {
  return (
    <div style={{ padding: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <button onClick={onBack} style={{
          borderRadius: tokens.radius.lg, border: "1px solid " + tokens.colors.border,
          background: tokens.colors.panel2, color: tokens.colors.text, padding: "10px 12px",
          fontWeight: 900, cursor: "pointer"
        }}>Voltar</button>

        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 16, fontWeight: 950 }}>{exercise.name}</div>
          <div style={{ fontSize: 12, color: tokens.colors.muted }}>
            {exercise.primary} • {exercise.location} • {exercise.level}
          </div>
        </div>
      </div>

      <div style={{
        marginTop: 12, borderRadius: tokens.radius.xl, border: "1px solid " + tokens.colors.border,
        background: tokens.colors.panel2, padding: 14
      }}>
        <div style={{ fontWeight: 950, marginBottom: 8 }}>Preview do movimento</div>
        <div style={{
          height: 170, borderRadius: 16, border: "1px dashed " + tokens.colors.border,
          display: "grid", placeItems: "center", color: tokens.colors.muted, fontWeight: 900
        }}>(placeholder animação/ilustração)</div>

        <div style={{ marginTop: 14 }}>
          <div style={{ fontWeight: 950, marginBottom: 6 }}>Como executar</div>
          <ol style={{ margin: 0, paddingLeft: 18 }}>
            {exercise.steps.map((s, i) => <li key={i} style={{ marginBottom: 6, fontSize: 13 }}>{s}</li>)}
          </ol>
        </div>

        <div style={{ marginTop: 14 }}>
          <div style={{ fontWeight: 950, marginBottom: 6 }}>Dicas rápidas</div>
          <ul style={{ margin: 0, paddingLeft: 18, color: tokens.colors.muted }}>
            {exercise.tips.map((t, i) => <li key={i} style={{ marginBottom: 6, fontSize: 13 }}>{t}</li>)}
          </ul>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
          <button onClick={() => onAdd(exercise)} style={{
            flex: 1, borderRadius: 16, border: "1px solid " + tokens.colors.border,
            background: tokens.colors.blue, color: "#001018", padding: 12,
            fontWeight: 1000, cursor: "pointer"
          }}>Adicionar ao treino</button>

          <button style={{
            borderRadius: 16, border: "1px solid " + tokens.colors.border,
            background: tokens.colors.panel, color: tokens.colors.text, padding: 12,
            fontWeight: 1000, cursor: "pointer"
          }}>Favoritar</button>
        </div>
      </div>
    </div>
  );
}
