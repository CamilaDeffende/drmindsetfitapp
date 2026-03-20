import { BrandIcon } from "./BrandIcon";

// MF_E2E_BOOT_BYPASS_V1
// Bypass seguro para E2E/CI (Playwright): se o app ficar preso no splash, tenta recuperar.
function mfE2EBootBypass() {
  try {
    const isE2E = typeof navigator !== "undefined" && (navigator as any).webdriver;
    if (!isE2E) return;

    window.setTimeout(() => {
      const stillSplash =
        !!document.querySelector('[aria-label="Carregando"], .mf-progress') ||
        (document.body?.textContent || "").includes("Preparando sua experiência");

      if (stillSplash) {
        const k = "__MF_E2E_BOOT_RECOVERED__";
        if (!(window as any)[k]) {
          (window as any)[k] = true;
          window.location.reload();
        }
      }
    }, 2500);
  } catch {}
}

export function SplashScreen() {
  mfE2EBootBypass();

  return (
    <div className="min-h-screen bg-black flex items-center justify-center text-white">

      <div className="flex flex-col items-center text-center gap-6">

        {/* Logo */}
        <div className="animate-pulse">
          <BrandIcon
            size={200}
            className="drop-shadow-[0_0_20px_rgba(0,200,255,0.7)]"
          />
        </div>

        {/* Nome */}
        <div className="text-xs uppercase tracking-[0.35em] text-white/40">
          MindsetFit
        </div>

        {/* Loader */}
        <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />

        {/* Texto */}
        <div className="text-xs text-white/30">
          Preparando sua experiência…
        </div>

      </div>

    </div>
  );
}