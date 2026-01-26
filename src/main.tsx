import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { DrMindSetfitProvider } from "./contexts/DrMindSetfitContext";
import { SplashScreen } from "./components/branding/SplashScreen";
import "./index.css";
import { DevErrorOverlay } from "@/components/system/DevErrorOverlay";

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

createRoot(el).render(
  <React.StrictMode>
    <DrMindSetfitProvider>
      <BootSplash>
        <DevErrorOverlay>
          <App />
        </DevErrorOverlay>
      </BootSplash>
    </DrMindSetfitProvider>
  </React.StrictMode>
);
