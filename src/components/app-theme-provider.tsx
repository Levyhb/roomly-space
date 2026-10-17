"use client";

import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import type { ReactNode } from "react";

const theme = createTheme({
  palette: {
    primary: { main: "#572166", dark: "#35113f" },
    secondary: { main: "#ff681b", dark: "#d84c08" },
    background: { default: "#faf8fb", paper: "#ffffff" },
    text: { primary: "#211a2b", secondary: "#655d70" },
    divider: "#e8e0ec",
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: "Arial, Helvetica, sans-serif",
    h1: { fontWeight: 800, letterSpacing: "-0.04em" },
    h2: { fontWeight: 750, letterSpacing: "-0.03em" },
    button: { fontWeight: 700, textTransform: "none" },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { minHeight: 44, borderRadius: 10 },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { border: "1px solid #e8e0ec", boxShadow: "none" },
      },
    },
  },
});

export function AppThemeProvider({ children }: { children: ReactNode }) {
  return (
    <AppRouterCacheProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
