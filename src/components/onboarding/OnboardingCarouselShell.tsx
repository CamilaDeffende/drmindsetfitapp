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
  onNext?: () => void;
  onSkip?: () => void;
  microcopy?: string;
};

export function OnboardingCarouselShell({
  currentIndex,
  onIndexChange,
  steps,
  onBack,
  onNext,
  onSkip,
  microcopy = "Isso alimenta seu plano e relatório.",
}: Props) {
  const scrollerRef = React.useRef<HTMLDivElement | null>(null);

  // scroll programático quando o index muda (botões/estado)
  React.useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const w = el.clientWidth;
    el.scrollTo({ left: currentIndex * w, behavior: "smooth" });
  }, [currentIndex]);

  // sync do index quando o usuário dá swipe
  const onScroll = React.useMemo(() => {
    let raf = 0;
    return () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = scrollerRef.current;
        if (!el) return;
        const w = el.clientWidth || 1;
        const idx = Math.round(el.scrollLeft / w);
        if (idx !== currentIndex && idx >= 0 && idx < steps.length) onIndexChange(idx);
      });
    };
  }, [currentIndex, onIndexChange, steps.length]);

  const total = steps.length;
  const stepLabel = `${currentIndex + 1}/${total} — ${steps[currentIndex]?.title ?? ""}`;
  const canPrev = currentIndex > 0;
  const canNext = currentIndex < total - 1;
  const allowSkip = !!steps[currentIndex]?.allowSkip;

  return (
    <div className="min-h-screen bg-black text-white">

        <div className="flex items-center gap-3" data-ui="mindsetfit-logo-header">
          <img
            src="/brand/mindsetfit-logo.png"
            alt="MindsetFit"
            className="h-7 w-auto select-none"
            draggable={false}
          />
          <div className="leading-tight">
            <div className="text-[12px] uppercase tracking-wider text-white/60">MindsetFit</div>
            <div className="text-[11px] text-white/45">Onboarding premium</div>
          </div>
        </div>

      {/* Header fixo */}
      <div className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur">
        <div className="mx-auto w-full max-w-[720px] px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onBack}
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
                  i <= currentIndex ? "bg-white/80" : "bg-white/15",
                ].join(" ")}
              />
            ))}
          </div>

          {/* dots */}
          <div className="mt-2 flex items-center justify-center gap-1.5">
            {steps.map((_, i) => (
              <div
                key={i}
                className={[
                  "h-1.5 w-1.5 rounded-full",
                  i === currentIndex ? "bg-white/90" : "bg-white/25",
                ].join(" ")}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Espaço do header */}
      <div className="h-[108px]" />

      {/* Área central (carrossel) */}
      <div className="relative mx-auto w-full max-w-[720px] px-4">
        {/* Botões laterais < > */}
        <button
          type="button"
          onClick={() => canPrev && onIndexChange(currentIndex - 1)}
          className={[
            "absolute left-2 top-1/2 -translate-y-1/2 z-40",
            "rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-white/90",
            canPrev ? "hover:bg-white/10" : "opacity-30 pointer-events-none",
          ].join(" ")}
          aria-label="Anterior"
        >
          ‹
        </button>

        <button
          type="button"
          onClick={() => canNext && onIndexChange(currentIndex + 1)}
          className={[
            "absolute right-2 top-1/2 -translate-y-1/2 z-40",
            "rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-white/90",
            canNext ? "hover:bg-white/10" : "opacity-30 pointer-events-none",
          ].join(" ")}
          aria-label="Próximo"
        >
          ›
        </button>

        <div
          ref={scrollerRef}
          onScroll={onScroll}
          className="flex w-full overflow-x-auto snap-x snap-mandatory scroll-smooth touch-pan-x [-webkit-overflow-scrolling:touch]"
          style={{ scrollSnapType: "x mandatory" }}
        >
          {steps.map((s) => (
            <div
              key={s.key}
              className="w-full shrink-0 snap-center px-1"
              style={{ scrollSnapAlign: "center" }}
            >
              <div className="rounded-3xl border border-white/10 bg-white/5 shadow-xl p-4 max-h-[calc(100vh-220px)] overflow-y-auto overscroll-contain">
                <div className="text-xs text-white/60">{microcopy}</div>
                <div className="mt-3">{s.content}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Espaço do footer */}
      <div className="pb-[calc(104px+env(safe-area-inset-bottom))]" />

      {/* Footer fixo */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-black/80 backdrop-blur">
        <div className="mx-auto w-full max-w-[720px] px-4 py-3">
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={onNext}
              className="w-full rounded-2xl bg-white text-black font-extrabold py-3 active:scale-[0.99] transition"
            >
              Salvar e continuar
            </button>

            {allowSkip ? (
              <button
                type="button"
                onClick={onSkip}
                className="w-full rounded-2xl border border-white/15 bg-white/5 text-white/85 py-2.5 active:scale-[0.99] transition"
              >
                Pular por enquanto
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
