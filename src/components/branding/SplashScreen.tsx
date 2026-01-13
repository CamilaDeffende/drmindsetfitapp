type Props = {
  label?: string;
};

export function SplashScreen({ label = "Carregando MindsetFit…" }: Props) {
  return (
    <div
      className="min-h-screen bg-black text-white flex items-center justify-center px-6"
      style={{
        background:
          "radial-gradient(1200px 600px at 50% 35%, rgba(0,149,255,0.18), rgba(0,0,0,1) 60%)",
      }}
      data-ui="splash"
    >
      <div className="w-full max-w-[520px] flex flex-col items-center">
        <div className="relative">
          {/* glow */}
          <div
            className="absolute inset-0 -z-10 blur-3xl opacity-70"
            style={{
              background:
                "radial-gradient(closest-side, rgba(0,149,255,0.55), rgba(0,0,0,0))",
              transform: "scale(1.2)",
            }}
          />
          <img
            src="/brand/mindsetfit-logo.png"
            alt="MindsetFit"
            className="w-[230px] h-auto select-none"
            draggable={false}
          />
        </div>

        <div className="mt-6 text-center">
          <div className="text-sm tracking-wide text-white/75">
            Performance • Estética • Longevidade
          </div>
          <div className="mt-2 text-xs text-white/55">{label}</div>
        </div>

        {/* loading */}
        <div className="mt-8 flex items-center gap-3">
          <span className="inline-flex h-5 w-5 items-center justify-center">
            <span className="h-5 w-5 rounded-full border-2 border-white/25 border-t-white/85 animate-spin" />
          </span>
          <span className="text-xs text-white/60">Preparando sua experiência…</span>
        </div>

        {/* micro footer */}
        <div className="mt-10 text-[11px] text-white/40">
          Build premium • Mobile-first • Ciência aplicada
        </div>
      </div>
    </div>
  );
}
