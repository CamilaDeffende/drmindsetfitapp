import { useOnboardingDraftSaver } from "@/store/onboarding/useOnboardingDraftSaver";

type Props = {
  value: { days: string[] };
  onChange: (v: Props["value"]) => void;
  onNext: () => void;
  onBack?: () => void;
};

const DAYS = ["seg", "ter", "qua", "qui", "sex", "sab", "dom"];

export default function Step6DiasSemana({ value, onChange, onNext, onBack }: Props) {
/* MF_BLOCK2_1_STEP6_AUTOSAVE */
  useOnboardingDraftSaver({ step6DiasSemana: value } as any, 400);

  const toggle = (d: string) => {
    const set = new Set(value.days);
    if (set.has(d)) {
      set.delete(d);
    } else {
      set.add(d);
    }
    onChange({ days: Array.from(set) });
  };

  return (
    <div>
      <h2 className="text-xl font-semibold">Dias de treino</h2>

      <div className="mt-4 flex flex-wrap gap-2">
        {DAYS.map(d => (
          <button
            key={d}
            onClick={() => toggle(d)}
            className={`px-3 py-2 rounded-lg border \${value.days.includes(d) ? "border-white/30 bg-white/10" : "border-white/10"}`}
          >
            {d.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="mt-6 flex justify-between">
        <button onClick={onBack}>Voltar</button>
        <button disabled={value.days.length === 0} onClick={onNext}>Continuar</button>
      </div>
    </div>
  );
}
