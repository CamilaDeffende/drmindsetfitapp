import { createContext, useContext, useState } from "react";

type Mode = "paciente" | "profissional";

const AppModeContext = createContext<{mode: Mode; setMode: (m: Mode) => void}>({
  mode: "paciente",
  setMode: () => {}
});

export function AppModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<Mode>("paciente");
  return (
    <AppModeContext.Provider value={{ mode, setMode }}>
      {children}
    </AppModeContext.Provider>
  );
}

export const useAppMode = () => useContext(AppModeContext);
