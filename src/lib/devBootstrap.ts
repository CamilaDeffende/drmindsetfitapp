export function runMFDevBootstrap() {
  if (typeof window === "undefined") return;

  try {
    const url = new URL(window.location.href);
    const forceReset =
      url.searchParams.get("mfreset") === "1" ||
      url.searchParams.get("reset") === "1";

    const marker = "mf_dev_bootstrap_v1";
    const shouldNuke = forceReset;

    if (shouldNuke) {
      const keysToRemove: string[] = [];

      for (let i = 0; i < localStorage.length; i += 1) {
        const k = localStorage.key(i);
        if (!k) continue;
        const low = k.toLowerCase();

        if (
          low.includes("mindsetfit") ||
          low.includes("drmindsetfit") ||
          low.includes("mf_") ||
          low.includes("mf-") ||
          low.includes("onboarding") ||
          low.includes("zustand") ||
          low.includes("persist") ||
          low.includes("dashboard") ||
          low.includes("auth") ||
          low.includes("supabase") ||
          low.includes("session")
        ) {
          keysToRemove.push(k);
        }
      }

      keysToRemove.forEach((k) => {
        try { localStorage.removeItem(k); } catch {}
      });

      try { sessionStorage.clear(); } catch {}
      try { sessionStorage.setItem(marker, "1"); } catch {}

      if (forceReset) {
        url.searchParams.delete("mfreset");
        url.searchParams.delete("reset");
        window.history.replaceState({}, "", url.toString());
      }
    } else {
      try { sessionStorage.setItem(marker, "1"); } catch {}
    }
  } catch (err) {
    console.warn("[MF] devBootstrap falhou:", err);
  }
}
