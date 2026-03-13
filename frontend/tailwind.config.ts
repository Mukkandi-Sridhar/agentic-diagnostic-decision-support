import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./types/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "#f4f8f7",
        foreground: "#0f1720",
        panel: "#ffffff",
        muted: "#6b7a85",
        accent: "#0f766e",
        accentSoft: "#dff4f0",
        alert: "#b45309",
        danger: "#b42318",
        border: "#d4dde2"
      },
      boxShadow: {
        clinical: "0 24px 80px rgba(11, 28, 38, 0.12)"
      },
      backgroundImage: {
        mesh: "radial-gradient(circle at top left, rgba(15,118,110,0.14), transparent 34%), radial-gradient(circle at bottom right, rgba(31,41,55,0.08), transparent 32%)"
      }
    }
  },
  plugins: []
};

export default config;

