import { useState } from "react";
import { tokens } from "../../ui/tokens";
import { BodyMapSVG } from "./BodyMapSVG";
import { useUIStore } from "../../store/useUIStore";

export function BodyMap() {
  const [side, setSide] = useState<"Front" | "Back">("Front");
  const setSelectedMuscle = useUIStore(s => s.setSelectedMuscle);

  return (
    <div style={{ padding: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 950 }}>Body Map</div>
          <div style={{ fontSize: 12, color: tokens.colors.muted }}>
            Toque no músculo para filtrar a Library
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          {(["Front", "Back"] as const).map(s => (
            <button
              key={s}
              onClick={() => setSide(s)}
              style={{
                borderRadius: 999,
                border: "1px solid " + tokens.colors.border,
                background: side === s ? tokens.colors.blue : tokens.colors.panel2,
                color: side === s ? "#001018" : tokens.colors.text,
                padding: "8px 10px",
                fontWeight: 1000,
                cursor: "pointer",
                fontSize: 12
              }}
            >
              {s === "Front" ? "Frente" : "Costas"}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <BodyMapSVG
          side={side}
          onSelect={(muscle) => {
            setSelectedMuscle(muscle);
          }}
        />
      </div>
    </div>
  );
}
