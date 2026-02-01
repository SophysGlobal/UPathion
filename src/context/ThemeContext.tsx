import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";

type Theme = "dark" | "light" | "system";
type ResolvedTheme = Exclude<Theme, "system">;

interface ThemeContextType {
  /** User preference */
  theme: Theme;
  /** Effective theme applied to the document */
  resolvedTheme: ResolvedTheme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const getSystemTheme = (): ResolvedTheme => {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") return "system";

    const stored = localStorage.getItem("theme");
    if (stored === "dark" || stored === "light" || stored === "system") return stored;

    return "system";
  });

  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => {
    if (typeof window === "undefined") return "dark";
    return theme === "system" ? getSystemTheme() : theme;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");

    const computeResolved = (): ResolvedTheme =>
      theme === "system" ? (mql.matches ? "dark" : "light") : theme;

    const apply = () => {
      const nextResolved = computeResolved();
      setResolvedTheme(nextResolved);

      // Tailwind uses .dark, and our CSS variables are defined for :root (light) and .dark.
      root.classList.remove("light", "dark");
      root.classList.add(nextResolved);
    };

    apply();
    localStorage.setItem("theme", theme);

    if (theme !== "system") return;

    const onChange = () => apply();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [theme]);

  const toggleTheme = () => {
    setThemeState((prev) => {
      const current: ResolvedTheme = prev === "system" ? resolvedTheme : prev;
      return current === "dark" ? "light" : "dark";
    });
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const value = useMemo(
    () => ({ theme, resolvedTheme, toggleTheme, setTheme }),
    [theme, resolvedTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

