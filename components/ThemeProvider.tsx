"use client";

import { useEffect } from "react";
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from "next-themes";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  useEffect(() => {
    const compactTables =
      window.localStorage.getItem("gestao-solidaria-compact") === "true";
    document.documentElement.classList.toggle("compact-tables", compactTables);
  }, []);

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
