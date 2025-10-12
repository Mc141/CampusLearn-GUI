import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import {
  ThemeProvider as MuiThemeProvider,
  createTheme,
} from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import App from "./App.tsx";
import { AuthProvider } from "./context/AuthContext.tsx";
import { ThemeProvider, useTheme } from "./context/ThemeContext.tsx";

// Modern theme configuration
const createAppTheme = (mode: "light" | "dark") =>
  createTheme({
    palette: {
      mode,
      primary: {
        main: mode === "light" ? "#6366f1" : "#8b5cf6", // Modern indigo/purple
        light: mode === "light" ? "#818cf8" : "#a78bfa",
        dark: mode === "light" ? "#4f46e5" : "#7c3aed",
      },
      secondary: {
        main: mode === "light" ? "#f59e0b" : "#fbbf24", // Modern amber
        light: mode === "light" ? "#fbbf24" : "#fcd34d",
        dark: mode === "light" ? "#d97706" : "#f59e0b",
      },
      background: {
        default: mode === "light" ? "#fafafa" : "#0f0f23",
        paper: mode === "light" ? "#ffffff" : "#1a1a2e",
      },
      text: {
        primary: mode === "light" ? "#1f2937" : "#f9fafb",
        secondary: mode === "light" ? "#6b7280" : "#d1d5db",
      },
      success: {
        main: "#10b981",
        light: "#34d399",
        dark: "#059669",
      },
      warning: {
        main: "#f59e0b",
        light: "#fbbf24",
        dark: "#d97706",
      },
      error: {
        main: "#ef4444",
        light: "#f87171",
        dark: "#dc2626",
      },
      info: {
        main: "#3b82f6",
        light: "#60a5fa",
        dark: "#2563eb",
      },
    },
    typography: {
      fontFamily:
        "'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
      h1: {
        fontWeight: 800,
        fontSize: "2.5rem",
        letterSpacing: "-0.025em",
      },
      h2: {
        fontWeight: 700,
        fontSize: "2rem",
        letterSpacing: "-0.025em",
      },
      h3: {
        fontWeight: 600,
        fontSize: "1.5rem",
        letterSpacing: "-0.025em",
      },
      h4: {
        fontWeight: 600,
        fontSize: "1.25rem",
        letterSpacing: "-0.025em",
      },
      h5: {
        fontWeight: 500,
        fontSize: "1.125rem",
      },
      h6: {
        fontWeight: 500,
        fontSize: "1rem",
      },
      body1: {
        fontSize: "1rem",
        lineHeight: 1.6,
      },
      body2: {
        fontSize: "0.875rem",
        lineHeight: 1.5,
      },
    },
    shape: {
      borderRadius: 16,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: "none",
            fontWeight: 600,
            borderRadius: 12,
            padding: "10px 24px",
            fontSize: "0.875rem",
            boxShadow: "none",
            "&:hover": {
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              transform: "translateY(-1px)",
            },
            transition: "all 0.2s ease-in-out",
          },
          contained: {
            background:
              mode === "light"
                ? "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)"
                : "linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)",
            "&:hover": {
              background:
                mode === "light"
                  ? "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)"
                  : "linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)",
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 20,
            boxShadow:
              mode === "light"
                ? "0 4px 20px rgba(0,0,0,0.08)"
                : "0 4px 20px rgba(0,0,0,0.3)",
            border:
              mode === "light"
                ? "1px solid rgba(0,0,0,0.05)"
                : "1px solid rgba(255,255,255,0.1)",
            backdropFilter: "blur(10px)",
            transition: "all 0.3s ease-in-out",
            "&:hover": {
              transform: "translateY(-2px)",
              boxShadow:
                mode === "light"
                  ? "0 8px 30px rgba(0,0,0,0.12)"
                  : "0 8px 30px rgba(0,0,0,0.4)",
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            backgroundImage: "none",
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            fontWeight: 500,
            fontSize: "0.75rem",
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            "& .MuiOutlinedInput-root": {
              borderRadius: 12,
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: mode === "light" ? "#6366f1" : "#8b5cf6",
              },
            },
          },
        },
      },
    },
  });

// Theme wrapper component
const ThemeWrapper: React.FC = () => {
  const { mode } = useTheme();
  const theme = createAppTheme(mode);

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <App />
      </AuthProvider>
    </MuiThemeProvider>
  );
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <ThemeWrapper />
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
