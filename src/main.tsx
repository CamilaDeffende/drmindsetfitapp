import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";import { SplashScreen } from "./components/branding/SplashScreen";
import "./index.css";
import { DevErrorOverlay } from "@/components/system/DevErrorOverlay";
import { ProfileProvider } from "@/contexts/ProfileContext";
import { useAuth } from "@/contexts/AuthContext";

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
  if (!userId) return null;
  return <ProfileProvider userId={userId} gate>{children}</ProfileProvider>;
}

createRoot(el).render(<RootProviders><React.StrictMode>
    <BootSplash>
        <DevErrorOverlay>
          <App />
        </DevErrorOverlay>
      </BootSplash>
  </React.StrictMode></RootProviders>);
