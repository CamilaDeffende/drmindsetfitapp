import { BrandIcon } from "./BrandIcon";

export function SplashScreen() {
  return (
    <div
      className="min-h-screen bg-black text-white flex items-center justify-center px-6"
      data-ui="mf-splash"
    >
      <div className="w-full max-w-[520px]">
        <div className="flex flex-col items-center text-center">
          <div className="relative">
            <div className="absolute -inset-6 rounded-full opacity-25 blur-2xl mf-grad" />
            <div className="relative rounded-3xl border border-white/10 bg-white/5 backdrop-blur px-6 py-5 mf-ring">
              <div className="flex items-center justify-center">
                <BrandIcon size={92} className="w-[92px] h-[92px]" />
              </div>

              <div className="mt-4 text-[13px] uppercase tracking-[0.24em] text-white/55">
                MindsetFit
              </div>
              <div className="mt-2 text-2xl font-extrabold text-white/95">
                DrMindSetFitApp
              </div>
              <div className="mt-2 text-sm text-white/60">
                Performance • Estética • Longevidade
              </div>

              <div className="mt-5 h-[10px] w-full rounded-full bg-white/10 overflow-hidden">
                <div className="h-full w-[46%] mf-grad animate-pulse rounded-full" />
              </div>

              <div className="mt-3 text-[12px] text-white/45">
                Carregando experiência premium…
              </div>
            </div>
          </div>

          <div className="mt-8 text-[11px] text-white/30">
            Sem login • Sem cadastro • Tudo local
          </div>
        </div>
      </div>
    </div>
  );
}
