import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { DrMindSetfitProvider } from "./contexts/DrMindSetfitContext";
import { SplashScreen } from "./components/branding/SplashScreen";
import "./index.css";

function BootSplash({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    const t = setTimeout(() => setReady(true), 850);
    return () => clearTimeout(t);
  }, []);

  if (!ready) return <SplashScreen />;
  return <>{children}</>;
}

const el = document.getElementById("root");
if (!el) throw new Error("Root element #root not found");

createRoot(el).render(
  <React.StrictMode>
    <BootSplash>
      <DrMindSetfitProvider>
        <App />
      </DrMindSetfitProvider>
    </BootSplash>
  </React.StrictMode>
);
