import * as React from "react";

type StepDef = {
  key: string;
  title: string;
  allowSkip?: boolean;
  content: React.ReactNode;
};

type Props = {
  currentIndex: number;
  onIndexChange: (next: number) => void;
  steps: StepDef[];
  onBack?: () => void;
  onSkip?: () => void;
  microcopy?: string;
  onNext?: () => void;
};

// ONBOARDING_NO_CAROUSEL_STABLE_V1
// Renderiza somente a etapa atual. Sem swipe/scroll/carrossel.
export function OnboardingCarouselShell({
  currentIndex,
  onIndexChange,
  steps,
  onBack,
  onSkip,
  microcopy = "Base do seu plano e relatório.",
  onNext,
}: Props) {
  const total = steps.length;
  const safeIndex = Math.max(0, Math.min(total - 1, currentIndex));
  const step = steps[safeIndex];
  const canPrev = safeIndex > 0;
  const canNext = safeIndex < total - 1;
  const allowSkip = !!step?.allowSkip;
  const stepLabel = `${safeIndex + 1}/${total} — ${step?.title ?? ""}`;

  const goPrev = () => {
    if (canPrev) onIndexChange(safeIndex - 1);
    else onBack?.();
  };

  const goNext = () => {
    // preferência: lógica do fluxo vem do OnboardingFlow (nextStep)
    if (typeof onNext === "function") return onNext();
    if (canNext) return onIndexChange(safeIndex + 1);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header fixo */}
      <div className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur">
        <div className="mx-auto w-full max-w-[720px] px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={goPrev}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90 hover:bg-white/10 active:scale-[0.99] transition"
              aria-label="Voltar"
            >
              ←
            </button>
            <div className="flex-1">
              <div className="text-[12px] uppercase tracking-wider text-white/60">Onboarding</div>
              <div className="text-base font-extrabold leading-tight text-white/95">{stepLabel}</div>
            </div>
            <div className="w-10" />
          </div>

          {/* Barra em 8 segmentos */}
          <div className="mt-3 grid grid-cols-8 gap-1">
            {steps.map((_, i) => (
              <div
                key={i}
                className={[
                  "h-1.5 rounded-full",
                  i <= safeIndex ? "bg-white/80" : "bg-white/15",
                ].join(" ")}
              />
            ))}
          </div>

          <div className="mt-2 text-[12px] text-white/60">{microcopy}</div>
        </div>
      </div>

      {/* Espaço do header */}
      <div className="h-[132px]" />

      {/* Conteúdo (apenas etapa atual) */}
      <div className="mx-auto w-full max-w-[720px] px-4 pb-[calc(110px+env(safe-area-inset-bottom))]">
        <div className="rounded-3xl border border-white/10 bg-white/5 shadow-xl p-4">
          <div className="mt-1">{step?.content}</div>
        </div>
      </div>

      {/* Footer fixo */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-black/80 backdrop-blur">
        <div className="mx-auto w-full max-w-[720px] px-4 py-3">
          <div className="flex gap-2">
            {allowSkip ? (
              <button
                type="button"
                onClick={onSkip}
                className="w-1/3 rounded-2xl border border-white/15 bg-white/5 text-white/85 py-3 text-[13px] font-semibold active:scale-[0.99] transition"
              >
                Pular
              </button>
            ) : (
              <div className="w-1/3" />
            )}
            <button
              type="button"
              onClick={goNext}
              className="w-2/3 rounded-2xl bg-gradient-to-r from-[#1E6BFF] via-[#00B7FF] to-[#00B7FF] py-3 text-[13px] font-extrabold text-white hover:opacity-95 active:scale-[0.99] transition"
            >
              {canNext ? "Próxima etapa" : "Finalizar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
