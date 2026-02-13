import { useMemo } from "react";

import { useOnboardingDraftSaver } from "@/store/onboarding/useOnboardingDraftSaver";
type Props = {
  value: {
    primary: string | null;
    secondary?: string | null;
  };
  onChange: (v: Props["value"]) => void;
  onNext: () => void;
  onBack?: () => void;
};

export default function Step5Modalidades({ value, onChange, onNext, onBack }: Props) {
/* MF_BLOCK2_1_STEP5MOD_AUTOSAVE */
  useOnboardingDraftSaver({ step5Modalidades: value } as any, 400);

  const options = useMemo(() => ([
    { key: "musculacao", label: "Musculação" },
    { key: "corrida", label: "Corrida" },
    { key: "bike", label: "Bike" },
    { key: "funcional", label: "Funcional" },
    { key: "cross", label: "Cross" },
  ]), []);

  const canNext = !!value.primary;

  return (
    <div>
      <h2 className="text-xl font-semibold">Modalidade principal</h2>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {options.map(o => (
          <button
            key={o.key}
            type="button"
            onClick={() => onChange({ primary: o.key })}
            className={`p-4 rounded-xl border \${value.primary === o.key ? "border-white/30 bg-white/10" : "border-white/10"}`}
          >
            {o.label}
          </button>
        ))}
      </div>

      <div className="mt-6 flex justify-between">
        <button onClick={onBack}>Voltar</button>
        <button disabled={!canNext} onClick={onNext}>Continuar</button>
      </div>
    </div>
  );
}
