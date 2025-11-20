import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class", ".theme-dark"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          200: "#bae6fd",
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
          800: "#075985",
          900: "#0c4a6e"
        }
      },
      fontFamily: {
  sans: ["Tajawal", "ui-sans-serif", "system-ui"]
      },
      boxShadow: {
        floating: "0 10px 30px -12px rgba(14, 165, 233, 0.45)"
      }
    }
  },
  plugins: []
};

export default config;
