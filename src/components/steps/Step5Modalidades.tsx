// MF_ONBOARDING_CONTRACT_V1
// MF_BLOCK2_1_STEP5MOD_AUTOSAVE
import { useMemo } from "react";
import { useOnboardingDraftSaver } from "@/store/onboarding/useOnboardingDraftSaver";

type Step5Value = {
  primary: string | null;
  secondary?: string | null;
};

type Props = {
  value?: Step5Value;
  onChange?: (v: Step5Value) => void;
  onNext?: () => void;
  onBack?: () => void;
};

export default function Step5Modalidades({
  value,
  onChange,
  onNext,
  onBack,
}: Props) {
  // Silenciar se o shell não usar ainda
  void onNext;
  void onBack;

  const safeValue: Step5Value = {
    primary: value?.primary ?? null,
    secondary: value?.secondary ?? null,
  };

  const safeOnChange = onChange ?? (() => {});

  // Autosave do step
  useOnboardingDraftSaver({ step5Modalidades: safeValue } as any, 400);

  const options = useMemo(
    () => [
      { key: "musculacao", label: "Musculação" },
      { key: "corrida", label: "Corrida" },
      { key: "bike", label: "Bike" },
      { key: "funcional", label: "Funcional" },
      { key: "cross", label: "Cross" },
    ],
    []
  );

  const handleSelectPrimary = (key: string) => {
    safeOnChange({
      ...safeValue,
      primary: key,
    });
  };

  return (
    <div data-testid="mf-step-root">
      <h2 className="text-xl font-semibold">Modalidade principal</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Escolha em qual modalidade o plano vai focar primeiro. Você pode
        combinar outras depois, no treino.
      </p>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {options.map((o) => {
          const active = safeValue.primary === o.key;
          return (
            <button
              key={o.key}
              type="button"
              onClick={() => handleSelectPrimary(o.key)}
              className={[
                "p-4 rounded-xl border text-left transition",
                active
                  ? "border-white/30 bg-white/10"
                  : "border-white/10 bg-white/5 hover:bg-white/10",
              ].join(" ")}
            >
              <span className="font-medium">{o.label}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex justify-between" />
    </div>
  );
}