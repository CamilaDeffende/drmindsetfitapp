// MF_BOOT_DEDUP_REACT_V1
// MF_MAIN_REACT_DUPE_FIX_V1
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";import { SplashScreen } from "./components/branding/SplashScreen";
import "./index.css";
import { DevErrorOverlay } from "@/components/system/DevErrorOverlay";
import { ProfileProvider } from "@/contexts/ProfileContext";
import {useAuth, AuthProvider} from "@/contexts/AuthContext";
import { AppProvider } from "@/contexts/AppContext";

import "leaflet/dist/leaflet.css";

import { initI18n } from "@/i18n";

function BootSplash({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    const t = window.setTimeout(() => setReady(true), 850);
    return () => window.clearTimeout(t);
  }, []);

  if (!ready) return <SplashScreen />;
  return <>{children}</>;
}

// init i18n antes do render (fallback pt-BR garantido)
initI18n();

const el = document.getElementById("root");
if (!el) throw new Error("Root element #root not found");


function RootProviders({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const userId = (auth as any)?.user?.id ?? (auth as any)?.session?.user?.id ?? null;

  // TODO (Phase 1.1): substituir por user.id real do AuthContext
  // MF_MAIN_GATE_V1: nunca retornar null no bootstrap (evita root vazio).
// Em DEMO/sem sessão: usar userId estável para permitir providers e onboarding renderizarem.
const __demoUserId = "demo-user-123";
const __resolvedUserId = userId ?? __demoUserId;
// se quiser bloquear SEMPRE sem auth real, troque por: return <SplashScreen />
// (mas em modo DEMO queremos UI viva)
// if (!userId) return <SplashScreen />;
// nota: __resolvedUserId garante ProfileProvider/AppProvider
void __resolvedUserId;
  // MF_MAIN_PROFILE_GATE_FALSE_V1: demo mode — não bloquear UI
  return (<ProfileProvider userId={__resolvedUserId} gate={false}><AppProvider>{children}</AppProvider></ProfileProvider>);
}

// MF_HARD_BOOT_DIAG_V1
type MF_BootEntry = { t: number; kind: string; msg: string; stack?: string };
declare global { interface Window { __mf_bootlog?: MF_BootEntry[] } }
function mfBootPush(kind: string, msg: string, stack?: string) {
  try {
    const w = window as any;
    w.__mf_bootlog = w.__mf_bootlog || [];
    w.__mf_bootlog.push({ t: Date.now(), kind, msg: String(msg), stack });
    // Keep last 80
    if (w.__mf_bootlog.length > 80) w.__mf_bootlog = w.__mf_bootlog.slice(-80);
    // Overlay
    let el = document.getElementById("mf-boot-overlay");
    if (!el) {
      el = document.createElement("div");
      el.id = "mf-boot-overlay";
      el.style.position = "fixed";
      el.style.inset = "0";
      el.style.zIndex = "2147483647";
      el.style.background = "rgba(0,0,0,0.92)";
      el.style.color = "#fff";
      el.style.fontFamily = "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace";
      el.style.fontSize = "12px";
      el.style.padding = "16px";
      el.style.overflow = "auto";
      el.style.display = "none";
      document.body.appendChild(el);
    }
    const lines = (w.__mf_bootlog || []).map((e: any) => {
      const dt = new Date(e.t).toISOString();
      const st = e.stack ? "\n" + e.stack : "";
      return `[${dt}] ${e.kind}: ${e.msg}${st}`;
    });
    el.textContent = "MF BOOT DIAG (mostra o que travou)\n\n" + lines.join("\n\n");
    // show overlay only on errors
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
    // Patch console.error to surface silent errors
    const _ce = console.error.bind(console);
    console.error = (...args: any[]) => {
      try { mfBootPush("console.error", args.map(a => String(a)).join(" ")); } catch {}
      _ce(...args);
    };
  }
} catch {}

// ErrorBoundary in main (catches React render errors)
class BootErrorBoundary extends React.Component<{ children: React.ReactNode }, { err?: any }> {
  state: { err?: any } = {};
  static getDerivedStateFromError(err: any) { return { err }; }
  componentDidCatch(err: any) {
    try { mfBootPush("error", String(err?.message || err), String(err?.stack || "")); } catch {}
  }
  render() {
    if (this.state.err) {
      return (
        <div style={{ padding: 16, fontFamily: "ui-monospace, Menlo, monospace", color: "white", background: "black", minHeight: "100vh" }}>
          <h2 style={{ fontSize: 16, marginBottom: 8 }}>MF: Erro ao iniciar</h2>
          <pre style={{ whiteSpace: "pre-wrap" }}>{String(this.state.err?.stack || this.state.err?.message || this.state.err)}</pre>
        </div>
      );
    }
    return this.props.children as any;
  }
}


createRoot(el).render(<AuthProvider>
<RootProviders><React.StrictMode>
    <BootSplash>
        <DevErrorOverlay>
          <BootErrorBoundary><App /></BootErrorBoundary>
        </DevErrorOverlay>
      </BootSplash>
  </React.StrictMode></RootProviders>
</AuthProvider>);

// MF_DEV_SW_UNREGISTER_V1
// Evita loading infinito em DEV por cache/Service Worker antigo.
// Seguro: só roda em DEV (Vite) e ignora erros.
try {
  if (import.meta.env.DEV && typeof window !== "undefined" && "serviceWorker" in navigator) {
    navigator.serviceWorker.getRegistrations()
      .then((regs) => regs.forEach((r) => { try { r.unregister(); } catch {} }))
      .catch(() => {});
  }
} catch {}
