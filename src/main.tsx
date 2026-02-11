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

createRoot(el).render(<AuthProvider>
<RootProviders><React.StrictMode>
    <BootSplash>
        <DevErrorOverlay>
          <App />
        </DevErrorOverlay>
      </BootSplash>
  </React.StrictMode></RootProviders>
</AuthProvider>);
