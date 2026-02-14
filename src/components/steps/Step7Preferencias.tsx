import { useOnboardingDraftSaver } from "@/store/onboarding/useOnboardingDraftSaver";
type Props = {
  value: { dieta: string };
  onChange: (v: Props["value"]) => void;
  onNext: () => void;
  onBack?: () => void;
};

export default function Step7Preferencias({ value, onChange, onNext, onBack }: Props) {
  // MF_VOID_UNUSED_PROPS_V1
  void onNext; void onBack;

/* MF_BLOCK2_1_STEP7PREF_AUTOSAVE */
  useOnboardingDraftSaver({ step7Preferencias: value } as any, 400);

  const options = [
    { k: "flexivel", label: "Flexível", desc: "Aderência acima de tudo." },
    { k: "onivoro", label: "Onívoro", desc: "Variedade completa." },
    { k: "vegetariano", label: "Vegetariano", desc: "Sem carnes, com estratégia." },
    { k: "vegano", label: "Vegano", desc: "100% vegetal bem planejado." },
    { k: "lowcarb", label: "Low carb", desc: "Carbo moderado/baixo com performance." },
  ] as const;

  const current = value?.dieta || "flexivel";

  return (
    <div className="w-full">
      <h2 className="text-xl font-semibold">Preferências alimentares</h2>
      <p className="mt-2 text-sm opacity-80">
        Isso ajusta suas sugestões sem radicalizar. Você poderá editar depois.
      </p>

      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {options.map((o) => {
          const isActive = current === o.k;
          return (
            <button
              key={o.k}
              type="button"
              onClick={() => onChange({ dieta: o.k })}
              className={[
                "text-left p-4 rounded-2xl border transition",
                isActive ? "border-white/30 bg-white/10" : "border-white/10 hover:border-white/20",
              ].join(" ")}
            >
              <div className="font-semibold">{o.label}</div>
              <div className="text-sm opacity-80 mt-1">{o.desc}</div>
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
</div>
    </div>
  );
}
