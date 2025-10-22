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
import "./styles/belgium-campus-colors.css";

// Belgium Campus inspired theme configuration
const createAppTheme = (mode: "light" | "dark") =>
  createTheme({
    palette: {
      mode,
      // Belgium Campus Primary Brand Colors
      primary: {
        main: mode === "light" ? "#27C5BE" : "#33D3CA", // Teal Cyan - Belgium Campus signature
        light: mode === "light" ? "#33D3CA" : "#4DDDD4", // Aqua Mint variant
        dark: mode === "light" ? "#1FA39C" : "#27C5BE", // Darker teal
      },
      secondary: {
        main: mode === "light" ? "#A20046" : "#B3145A", // Deep Crimson - Belgium Campus accent
        light: mode === "light" ? "#B3145A" : "#C91A6B", // Raspberry variant
        dark: mode === "light" ? "#8A0039" : "#A20046", // Darker crimson
      },
      // Background colors
      background: {
        default: mode === "light" ? "#F9F9F9" : "#101010", // White Smoke / Jet Black
        paper: mode === "light" ? "#FFFFFF" : "#181818", // White / Graphite Black
      },
      // Text colors
      text: {
        primary: mode === "light" ? "#222222" : "#F9F9F9", // Charcoal Black / White Smoke
        secondary: mode === "light" ? "#555555" : "#BFBFBF", // Graphite Grey / Cool Grey
      },
      // Semantic colors
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
        main: "#27C5BE", // Use Belgium Campus teal for info
        light: "#33D3CA",
        dark: "#1FA39C",
      },
      // Custom Belgium Campus colors
      divider: mode === "light" ? "#DDDDDD" : "#404040", // Silver Grey / Dark divider
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
                ? "linear-gradient(135deg, #27C5BE 0%, #A20046 100%)" // Belgium Campus teal to crimson
                : "linear-gradient(135deg, #33D3CA 0%, #B3145A 100%)", // Dark mode variant
            "&:hover": {
              background:
                mode === "light"
                  ? "linear-gradient(135deg, #1FA39C 0%, #8A0039 100%)" // Darker variants
                  : "linear-gradient(135deg, #27C5BE 0%, #A20046 100%)", // Original colors on hover
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
                borderColor: mode === "light" ? "#27C5BE" : "#33D3CA", // Belgium Campus teal
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
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <ThemeProvider>
        <ThemeWrapper />
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
