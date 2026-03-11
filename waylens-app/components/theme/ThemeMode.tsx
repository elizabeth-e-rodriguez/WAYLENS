import React, { createContext, useContext, useMemo, useState } from "react";

export type ThemeMode = "system" | "light" | "dark";

type Ctx = {
  mode: ThemeMode;
  setMode: (m: ThemeMode) => void;
};

const ThemeModeContext = createContext<Ctx | null>(null);

export function ThemeModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>("system");
  const value = useMemo(() => ({ mode, setMode }), [mode]);
  return <ThemeModeContext.Provider value={value}>{children}</ThemeModeContext.Provider>;
}

export function useThemeMode() {
  const ctx = useContext(ThemeModeContext);
  if (!ctx) throw new Error("useThemeMode must be used within ThemeModeProvider");
  return ctx;
}