import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type ThemePref = "system" | "light" | "dark";
export type Theme = "light" | "dark";

interface ThemeValue {
  pref: ThemePref;
  theme: Theme;
  setPref: (p: ThemePref) => void;
}

const ThemeContext = createContext<ThemeValue | null>(null);
const KEY = "tmai-theme";

function readPref(): ThemePref {
  try {
    const v = localStorage.getItem(KEY);
    if (v === "light" || v === "dark") return v;
  } catch {
    // storage unavailable (private mode, blocked cookies)
  }
  return "system";
}

function systemTheme(): Theme {
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyPref(pref: ThemePref) {
  const root = document.documentElement;
  if (pref === "system") delete root.dataset.theme;
  else root.dataset.theme = pref;
  try {
    if (pref === "system") localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, pref);
  } catch {
    // ignore
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [pref, setPrefState] = useState<ThemePref>(readPref);
  const [system, setSystem] = useState<Theme>(systemTheme);

  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!mq) return;
    const onChange = () => setSystem(mq.matches ? "dark" : "light");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Applied synchronously (not in an effect) so that children redrawing canvases
  // in their own effects already see the new CSS variables.
  const setPref = (p: ThemePref) => {
    applyPref(p);
    setPrefState(p);
  };

  const theme: Theme = pref === "system" ? system : pref;
  return <ThemeContext.Provider value={{ pref, theme, setPref }}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme outside ThemeProvider");
  return ctx;
}

/** Read a CSS custom property (for canvas drawing). Re-read when the theme changes. */
export function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}
