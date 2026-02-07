import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand
        primary: "#6C63FF",
        danger: "#FF6B6B",
        info: "#4ECDC4",
        warning: "#FFE66D",

        // Per-category palette (also mirrored in lib/utils.ts for Recharts)
        cat: {
          supermercado: "#6C63FF",
          delivery: "#F97316",
          servicios: "#FF6B6B",
          suscripciones: "#A855F7",
          transporte: "#4ECDC4",
          salud: "#A78BFA",
          entretenimiento: "#FFE66D",
          mantenimiento: "#6B7280",
          otros: "#9CA3AF",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
