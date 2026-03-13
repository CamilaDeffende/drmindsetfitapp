// MF_BOOT_DEDUP_REACT_V1
// MF_MAIN_REACT_DUPE_FIX_V3
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { SplashScreen } from "./components/branding/SplashScreen";
import "./index.css";
import { DevErrorOverlay } from "@/components/system/DevErrorOverlay";
import { ProfileProvider } from "@/contexts/ProfileContext";
import { useAuth, AuthProvider } from "@/contexts/AuthContext";
import { AppProvider } from "@/contexts/AppContext";

// Sync global pós-auth
import PostAuthSyncGate from "@/sync/PostAuthSyncGate";

import "leaflet/dist/leaflet.css";
import { initI18n } from "@/i18n";

function BootSplash({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    console.log("BootSplash: iniciando timer...");
    const t = window.setTimeout(() => {
      console.log("BootSplash: pronto!");
      setReady(true);
    }, 850);
    return () => window.clearTimeout(t);
  }, []);

  if (!ready) {
    console.log("BootSplash: mostrando splash...");
    return <SplashScreen />;
  }
  console.log("BootSplash: renderizando app...");
  return <>{children}</>;
}

// init i18n antes do render (fallback pt-BR garantido)
initI18n();

const el = document.getElementById("root");
if (!el) throw new Error("Root element #root not found");

// Detecta Capacitor
const isNative = typeof window !== "undefined" && !!(window as any).Capacitor;

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

    let overlay = document.getElementById("mf-boot-overlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "mf-boot-overlay";
      overlay.style.position = "fixed";
      overlay.style.inset = "0";
      overlay.style.zIndex = "2147483647";
      overlay.style.background = "rgba(0,0,0,0.92)";
      overlay.style.color = "#fff";
      overlay.style.fontFamily =
        'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';
      overlay.style.fontSize = "12px";
      overlay.style.padding = "16px";
      overlay.style.overflow = "auto";
      overlay.style.display = "none";
      document.body.appendChild(overlay);
    }

    const lines = (w.__mf_bootlog || []).map((e: any) => {
      const dt = new Date(e.t).toISOString();
      const st = e.stack ? "\n" + e.stack : "";
      return `[${dt}] ${e.kind}: ${e.msg}${st}`;
    });

    overlay.textContent = "MF BOOT DIAG (mostra o que travou)\n\n" + lines.join("\n\n");
    if (kind === "error" || kind === "rejection") overlay.style.display = "block";
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

function RootProviders({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const userId = (auth as any)?.user?.id ?? (auth as any)?.session?.user?.id ?? null;

  // Para o Android/iOS: aguarda auth “assentar”
  const [waited, setWaited] = React.useState(false);
  React.useEffect(() => {
    if (!isNative) return;
    const t = window.setTimeout(() => setWaited(true), 4000);
    return () => window.clearTimeout(t);
  }, []);

  // Se for nativo e ainda não carregou auth, splash por alguns segundos
  if (isNative && !userId && !waited) return <SplashScreen />;

  // Se for nativo e NÃO veio sessão, continua em modo DEMO pra não travar
  const __demoUserId = "demo-user-123";
  const __resolvedUserId = userId ?? __demoUserId;

  return (
    <ProfileProvider userId={__resolvedUserId} gate={false}>
      <AppProvider>{children}</AppProvider>
    </ProfileProvider>
  );
}

createRoot(el).render(
  <AuthProvider>
    <PostAuthSyncGate />
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
);

// MF_DEV_SW_UNREGISTER_V3
// No Capacitor e em DEV: desregistra SW antigo para não sobrar cache quebrando o carregamento.
try {
  const shouldUnregisterSW = import.meta.env.DEV || isNative;
  if (shouldUnregisterSW && typeof window !== "undefined" && "serviceWorker" in navigator) {
    navigator.serviceWorker
      .getRegistrations()
      .then((regs) => regs.forEach((r) => r.unregister().catch?.(() => {})))
      .catch(() => {});
  }
} catch {}