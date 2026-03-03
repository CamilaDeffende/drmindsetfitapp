import { useMemo, useState } from "react";
import { buildMetabolicPlanV1 } from "../../engine/metabolic/v1";
import type { MetabolicInputV1 } from "../../engine/metabolic/v1/types";

export default function EnginePreviewPage() {
  const [input, setInput] = useState<MetabolicInputV1>({
    sex: "male",
    ageYears: 30,
    weightKg: 80,
    heightCm: 180,
    trainingFrequencyPerWeek: 4,
    trainingOverallIntensity: "moderada",
    weeklySessions: [
      { modality: "musculacao", intensity: "alta", minutes: 60 },
      { modality: "corrida", intensity: "moderada", minutes: 40 },
      { modality: "bike_indoor", intensity: "moderada", minutes: 45 },
    ],
    goal: "cutting",
  });

  const result = useMemo(() => buildMetabolicPlanV1(input), [input]);

  return (
    <div style={{ padding: 16, maxWidth: 980, margin: "0 auto" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700 }}>MF Metabolic Engine V1 — Preview (Interno)</h1>
      <p style={{ opacity: 0.8 }}>
        Página interna para validar o motor sem alterar onboarding/fluxo principal.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
        <label>
          Peso (kg)
          <input
            type="number"
            value={input.weightKg}
            onChange={(e) => setInput((s) => ({ ...s, weightKg: Number(e.target.value) }))}
            style={{ width: "100%", padding: 8 }}
          />
        </label>

        <label>
          Altura (cm)
          <input
            type="number"
            value={input.heightCm}
            onChange={(e) => setInput((s) => ({ ...s, heightCm: Number(e.target.value) }))}
            style={{ width: "100%", padding: 8 }}
          />
        </label>

        <label>
          Idade (anos)
          <input
            type="number"
            value={input.ageYears}
            onChange={(e) => setInput((s) => ({ ...s, ageYears: Number(e.target.value) }))}
            style={{ width: "100%", padding: 8 }}
          />
        </label>

        <label>
          Frequência semanal (0–7)
          <input
            type="number"
            value={input.trainingFrequencyPerWeek}
            onChange={(e) => setInput((s) => ({ ...s, trainingFrequencyPerWeek: Number(e.target.value) }))}
            style={{ width: "100%", padding: 8 }}
          />
        </label>

        <pre style={{ padding: 12, borderRadius: 12, background: "rgba(0,0,0,0.06)", overflowX: "auto" }}>
{JSON.stringify(result, null, 2)}
        </pre>
      </div>
    </div>
  );
}
