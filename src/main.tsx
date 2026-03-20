import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { SplashScreen } from "./components/branding/SplashScreen";
import { DevErrorOverlay } from "@/components/system/DevErrorOverlay";
import { ProfileProvider } from "@/contexts/ProfileContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppProvider } from "@/contexts/AppContext";
import { initI18n } from "@/i18n";
import { installDevFatalOverlay } from "./runtime/mf/devFatalOverlay";
import { installFreezeDetector } from "./runtime/mf/freezeDetector";

import { MFBackground } from "./components/mf/MFBackground";
import { runMFDevBootstrap } from "./lib/devBootstrap";
// Se você usa Leaflet e tem esse CSS instalado, descomente:
// import "leaflet/dist/leaflet.css";

// init i18n antes do render (fallback pt-BR garantido)
// MF_DEV_FATAL_OVERLAY_INSTALL_V1
if (import.meta.env.DEV) {
  installDevFatalOverlay();
}

// MF_FREEZE_DETECTOR_INSTALL_V1
if (import.meta.env.DEV) {
  installFreezeDetector({ thresholdMs: 1500, pollMs: 250 });
}


initI18n();

function BootSplash({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    const t = window.setTimeout(() => setReady(true), 850);
    return () => window.clearTimeout(t);
  }, []);

  return ready ? <>{children}</> : <SplashScreen />;
}

function RootProviders({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const userId =
    (auth as any)?.user?.id ??
    (auth as any)?.session?.user?.id ??
    null;

  // MF_MAIN_GATE_V1: nunca retornar null no bootstrap (evita root vazio)
  const __demoUserId = "demo-user-123";
  const __resolvedUserId = userId ?? __demoUserId;

  return (
    <ProfileProvider userId={__resolvedUserId} gate={false}>
      <AppProvider>{children}</AppProvider>
    </ProfileProvider>
  );
}

// MF_HARD_BOOT_DIAG_V1
type MF_BootEntry = { t: number; kind: string; msg: string; stack?: string };
declare global {
  interface Window {
    __mf_bootlog?: MF_BootEntry[];
  }
}

function mfBootPush(kind: string, msg: string, stack?: string) {
  try {
    const w = window as any;
    w.__mf_bootlog = w.__mf_bootlog || [];
    w.__mf_bootlog.push({ t: Date.now(), kind, msg: String(msg), stack });
    if (w.__mf_bootlog.length > 80) w.__mf_bootlog = w.__mf_bootlog.slice(-80);

    let el = document.getElementById("mf-boot-overlay");
    if (!el) {
      el = document.createElement("div");
      el.id = "mf-boot-overlay";
      el.style.position = "fixed";
      el.style.inset = "0";
      el.style.zIndex = "2147483647";
      el.style.background = "rgba(0,0,0,0.92)";
      el.style.color = "#fff";
      el.style.fontFamily =
        "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace";
      el.style.fontSize = "12px";
      el.style.padding = "16px";
      el.style.overflow = "auto";
      el.style.display = "none";
      document.body.appendChild(el);
    }

    const lines = (w.__mf_bootlog || []).map((e: any) => {
      const dt = new Date(e.t).toISOString();
      const st = e.stack ? "\\n" + e.stack : "";
      return `[${dt}] ${e.kind}: ${e.msg}${st}`;
    });

    el.textContent = "MF BOOT DIAG (mostra o que travou)\\n\\n" + lines.join("\\n\\n");
    if (kind === "error" || kind === "rejection") el.style.display = "block";
  } catch {}
}

try {
  if (typeof window !== "undefined") {
    window.addEventListener("error", (ev: any) => {
      const err = ev?.error;
      mfBootPush("error", String(ev?.message || err?.message || "window.error"), String(err?.stack || ""));
    });
    window.addEventListener("unhandledrejection", (ev: any) => {
      const r = ev?.reason;
      mfBootPush("rejection", String(r?.message || r || "unhandledrejection"), String(r?.stack || ""));
    });

    const _ce = console.error.bind(console);
    console.error = (...args: any[]) => {
      try {
        mfBootPush("console.error", args.map((a) => String(a)).join(" "));
      } catch {}
      _ce(...args);
    };
  }
} catch {}

class BootErrorBoundary extends React.Component<{ children: React.ReactNode }, { err?: any }> {
  state: { err?: any } = {};
  static getDerivedStateFromError(err: any) {
    return { err };
  }
  componentDidCatch(err: any) {
    try {
      mfBootPush("error", String(err?.message || err), String(err?.stack || ""));
    } catch {}
  }
  render() {
    if (this.state.err) {
      return (
        <div
          style={{
            padding: 16,
            fontFamily: "ui-monospace, Menlo, monospace",
            color: "white",
            background: "black",
            minHeight: "100vh",
          }}
        >
          <h2 style={{ fontSize: 16, marginBottom: 8 }}>MF: Erro ao iniciar</h2>
          <pre style={{ whiteSpace: "pre-wrap" }}>
            {String(this.state.err?.stack || this.state.err?.message || this.state.err)}
          </pre>
        </div>
      );
    }
    return this.props.children as any;
  }
}

const el = document.getElementById("root");
if (!el) throw new Error("Root element #root not found");

// MF_DEV_MOUNT_BANNER_V1
if (import.meta.env.DEV) {
  try {
    console.log("[MF] main.tsx carregou — DEV banner ativo");
    const id = "mf-dev-banner";
    if (!document.getElementById(id)) {
      const b = document.createElement("div");
      b.id = id;
      b.textContent = "MF DEV: React mounted OK (se você vê isso, o problema é dentro do <App/>)";
      b.style.position = "fixed";
      b.style.top = "10px";
      b.style.left = "10px";
      b.style.zIndex = "2147483647";
      b.style.padding = "10px 12px";
      b.style.borderRadius = "12px";
      b.style.background = "rgba(0, 255, 140, 0.18)";
      b.style.border = "1px solid rgba(0, 255, 140, 0.55)";
      b.style.color = "white";
      b.style.fontFamily = "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace";
      b.style.fontSize = "12px";
      document.body.appendChild(b);
    }
  } catch (e) {
    console.error("[MF] banner failed", e);
  }
}

runMFDevBootstrap();
createRoot(el).render(
  <MFBackground>

  <AuthProvider>
    <RootProviders>
      <React.StrictMode>
        <BootSplash>
          <DevErrorOverlay>
            <BootErrorBoundary>
              <App />
            </BootErrorBoundary>
          </DevErrorOverlay>
        </BootSplash>
      </React.StrictMode>
    </RootProviders>
  </AuthProvider>

  </MFBackground>
);

// MF_DEV_SW_UNREGISTER_V1
try {
  if (import.meta.env.DEV && typeof window !== "undefined" && "serviceWorker" in navigator) {
    navigator.serviceWorker
      .getRegistrations()
      .then((regs) => regs.forEach((r) => { try { r.unregister(); } catch {} }))
      .catch(() => {});
  }
} catch {}
