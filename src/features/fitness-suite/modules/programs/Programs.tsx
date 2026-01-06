import { useState } from "react";
import { programs } from "../../data/programs";
import { tokens } from "../../ui/tokens";

export function Programs() {
  const [selected, setSelected] = useState<string | null>(programs[0]?.id ?? null);

  return (
    <div style={{ padding: 14 }}>
      <div>
        <div style={{ fontSize: 16, fontWeight: 950 }}>Programs & Challenges</div>
        <div style={{ fontSize: 12, color: tokens.colors.muted }}>4 semanas + área de foco</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10, marginTop: 12 }}>
        {programs.map(p => (
          <button key={p.id} onClick={() => setSelected(p.id)}
            style={{
              textAlign: "left",
              borderRadius: tokens.radius.xl,
              border: "1px solid " + tokens.colors.border,
              background: selected === p.id ? "rgba(10,132,255,.14)" : tokens.colors.panel2,
              padding: 14,
              cursor: "pointer"
            }}
          >
            <div style={{ fontWeight: 1000, fontSize: 14 }}>{p.name}</div>
            <div style={{ fontSize: 12, color: tokens.colors.muted, marginTop: 4 }}>
              Focus: <b style={{ color: tokens.colors.text }}>{p.focus}</b> • {p.weeks} semana(s)
            </div>
          </button>
        ))}
      </div>

      <div style={{
        marginTop: 12,
        borderRadius: tokens.radius.xl,
        border: "1px solid " + tokens.colors.border,
        background: tokens.colors.panel2,
        padding: 14
      }}>
        <div style={{ fontWeight: 1000 }}>Calendário (placeholder premium)</div>
        <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8 }}>
          {Array.from({ length: 28 }).map((_, i) => (
            <div key={i} style={{
              height: 34,
              borderRadius: 12,
              border: "1px solid " + tokens.colors.border,
              background: i % 6 === 0 ? "rgba(0,230,118,.14)" : tokens.colors.panel,
              display: "grid",
              placeItems: "center",
              fontWeight: 1000,
              fontSize: 12,
              color: tokens.colors.text
            }}>{i + 1}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
