/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ===== BRAND =====
        primary: "#006e1c",
        "primary-container": "#ccffc4",

        secondary: "#ab2c5d",
        "secondary-fixed": "#ffd9e1",

        // ===== LIGHT SURFACE =====
        surface: "#f9f9f9",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f3f3f3",
        "surface-container": "#eeeeee",

        // ===== DARK SURFACE =====
        "surface-dark": "#0f172a",
        "surface-container-dark": "#111827",
        "surface-container-low-dark": "#1f2937",

        // ===== TEXT =====
        "on-surface": "#1a1c1c",
        "on-surface-variant": "#434844",

        // ===== DARK TEXT =====
        "on-surface-dark": "#f3f4f6",
        "on-surface-variant-dark": "#9ca3af",

        // ===== BORDER =====
        border: "#e5e7eb",
        "border-dark": "#374151",
      },

      fontFamily: {
        headline: ["Manrope", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },

      boxShadow: {
        glow: "0 12px 32px -4px rgba(26,28,28,0.06)",
        "glow-dark": "0 12px 32px -4px rgba(0,0,0,0.4)",
      },

      borderRadius: {
        xl: "1.5rem",
      },
    },
  },
  plugins: [],
}