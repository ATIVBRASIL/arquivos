/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./index.tsx",
    "./App.tsx",
    "./components/**/*.{ts,tsx}",
    "./**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "black-900": "#0B0D10",
        "graphite-800": "#141821",
        "graphite-700": "#1F2533",
        "graphite-600": "#2A3142",

        "text-primary": "#E6EAF2",
        "text-secondary": "#B0BACC",
        "text-muted": "#808AA3",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "Segoe UI", "Roboto", "Helvetica", "Arial", "sans-serif"],
        display: ["Rajdhani", "Inter", "system-ui", "Segoe UI", "Roboto", "Helvetica", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};
