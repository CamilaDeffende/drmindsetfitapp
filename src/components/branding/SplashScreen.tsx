import { BrandIcon } from "@/components/branding/BrandIcon";

type Props = { label?: string };

export function SplashScreen({ label = "Preparando sua experiência premium..." }: Props) {
  return (
    <div
      className="min-h-screen w-full flex items-center justify-center bg-black text-white"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      data-ui="splash-2.4"
    >
      {/* Background: halos suaves (blue/cyan) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full blur-3xl opacity-60 mf-anim-glow"
          style={{ background: "radial-gradient(circle, rgba(30,107,255,.55), rgba(0,183,255,.12), transparent 65%)" }}
        />
        <div
          className="absolute -bottom-48 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full blur-3xl opacity-45 mf-anim-glow"
          style={{ background: "radial-gradient(circle, rgba(0,183,255,.35), rgba(30,107,255,.10), transparent 68%)" }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,.06),transparent_45%)]" />
      </div>

      {/* Card */}
      <div className="relative w-full max-w-[520px] px-5">
        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl p-7 mf-anim-fadeup">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                {/* Glow wrapper */}
                <div
                  className="absolute -inset-3 rounded-full blur-2xl opacity-70 mf-anim-glow"
                  style={{ background: "radial-gradient(circle, rgba(0,183,255,.35), rgba(30,107,255,.15), transparent 70%)" }}
                />
                <div className="relative rounded-2xl border border-white/10 bg-black/40 p-3">
                  <BrandIcon className="w-10 h-10" />
                  {/* Shine */}
                  <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
                    <div
                      className="absolute -left-1/2 top-0 h-full w-1/2 skew-x-[-18deg] mf-anim-shine"
                      style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,.22), transparent)" }}
                    />
                  </div>
                </div>
              </div>

              <div className="leading-tight">
                <div className="text-[12px] uppercase tracking-[0.22em] text-white/55">
                  MindsetFit
                </div>
                <div className="mt-1 text-xl font-extrabold text-white/95">
                  DrMindSetFit
                </div>
                <div className="mt-1 text-xs text-white/55">
                  {label}
                </div>
              </div>
            </div>

            <div className="text-[11px] text-white/45">
              v<span className="tabular-nums">1.0</span>
            </div>
          </div>

          {/* Progress bar fake premium */}
          <div className="mt-6">
            <div className="h-2 w-full rounded-full bg-white/8 overflow-hidden border border-white/10">
              <div
                className="h-full w-1/2 mf-anim-progress"
                style={{ background: "linear-gradient(90deg, rgba(30,107,255,.10), rgba(0,183,255,.85), rgba(30,107,255,.25))" }}
              />
            </div>

            <div className="mt-4 flex items-center justify-between text-[11px] text-white/45">
              <span>Sincronizando módulos</span>
              <span className="tabular-nums">100%</span>
            </div>
          </div>

          {/* Microcopy */}
          <div className="mt-5 text-[12px] text-white/45">
            Sem login • Sem cadastro • Experiência mobile-first
          </div>
        </div>
      </div>
    </div>
  );
}
