import { tokens } from "../../ui/tokens";

type Muscle = "Chest" | "Back" | "Shoulders" | "Biceps" | "Triceps" | "Legs" | "Glutes" | "Core";

export function BodyMapSVG({ side, onSelect }: { side: "Front" | "Back"; onSelect: (m: Muscle) => void }) {
  // SVG simples e clicável (placeholder premium). Próximo passo: detalhar regiões reais.
  return (
    <svg viewBox="0 0 220 420" width="100%" height="340" style={{ display: "block" }}>
      <rect x="0" y="0" width="220" height="420" rx="22" fill={tokens.colors.panel2} stroke={tokens.colors.border} />
      <text x="110" y="34" textAnchor="middle" fill={tokens.colors.muted} fontSize="12" fontWeight="900">
        {side === "Front" ? "Front" : "Back"} — tap muscle
      </text>

      {/* Chest */}
      <rect x="55" y="70" width="110" height="60" rx="16" fill="rgba(10,132,255,.18)" stroke={tokens.colors.border}
        onClick={() => onSelect("Chest")} />
      <text x="110" y="105" textAnchor="middle" fill={tokens.colors.text} fontSize="12" fontWeight="900">Chest</text>

      {/* Core */}
      <rect x="70" y="145" width="80" height="70" rx="16" fill="rgba(10,132,255,.12)" stroke={tokens.colors.border}
        onClick={() => onSelect("Core")} />
      <text x="110" y="185" textAnchor="middle" fill={tokens.colors.text} fontSize="12" fontWeight="900">Core</text>

      {/* Legs */}
      <rect x="60" y="235" width="100" height="120" rx="16" fill="rgba(10,132,255,.10)" stroke={tokens.colors.border}
        onClick={() => onSelect("Legs")} />
      <text x="110" y="300" textAnchor="middle" fill={tokens.colors.text} fontSize="12" fontWeight="900">Legs</text>

      {/* Back / Glutes (quando costas) */}
      {side === "Back" && (
        <>
          <rect x="55" y="70" width="110" height="60" rx="16" fill="rgba(0,230,118,.10)" stroke={tokens.colors.border}
            onClick={() => onSelect("Back")} />
          <text x="110" y="105" textAnchor="middle" fill={tokens.colors.text} fontSize="12" fontWeight="900">Back</text>

          <rect x="70" y="225" width="80" height="50" rx="16" fill="rgba(0,230,118,.08)" stroke={tokens.colors.border}
            onClick={() => onSelect("Glutes")} />
          <text x="110" y="255" textAnchor="middle" fill={tokens.colors.text} fontSize="12" fontWeight="900">Glutes</text>
        </>
      )}
    </svg>
  );
}
