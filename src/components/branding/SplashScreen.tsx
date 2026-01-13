import { BrandIcon } from "./BrandIcon";

export function SplashScreen() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="flex flex-col items-center text-center gap-6">

        <BrandIcon size={52} />

        <div className="text-sm uppercase tracking-[0.28em] text-white/45">
          MindsetFit
        </div>

        <div className="text-xs text-white/30">
          Carregando experiência premium…
        </div>

      </div>
    </div>
  );
}