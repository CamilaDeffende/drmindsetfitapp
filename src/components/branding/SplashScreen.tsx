import { BrandIcon } from "./BrandIcon";

export function SplashScreen() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="flex flex-col items-center text-center gap-5 mf-fade-in">
        <div className="mf-slide-up">
          <BrandIcon size={52} />
        </div>

        <div className="text-[11px] uppercase tracking-[0.32em] text-white/45 mf-slide-up">
          MindsetFit
        </div>

        <div className="mf-progress" aria-label="Carregando" />

        <div className="text-[11px] text-white/28">
          Preparando sua experiência…
        </div>
      </div>
    </div>
  );
}