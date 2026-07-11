import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: "var(--card)",
        secondary: "var(--secondary)",
        muted: "var(--muted)",
        "muted-foreground": "var(--muted-foreground)",
        accent: "var(--accent)",
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        rose: "var(--rose)",
        blush: "var(--blush)",
        cream: "var(--cream)",
        gold: "var(--gold)",
        destructive: "var(--destructive)",
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        script: ["var(--font-script)", "cursive"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },
      backgroundImage: {
        "gradient-rose":
          "linear-gradient(135deg, #f07097 0%, #f4899e 50%, #e85d82 100%)",
        "gradient-soft":
          "linear-gradient(160deg, color-mix(in oklab, var(--blush) 60%, transparent) 0%, var(--background) 50%, color-mix(in oklab, var(--cream) 80%, transparent) 100%)",
      },
      boxShadow: {
        soft: "0 10px 40px -15px rgb(216 132 148 / 0.35)",
        card: "0 8px 30px -12px rgb(216 132 148 / 0.25)",
        glow: "0 10px 40px -10px rgb(240 112 151 / 0.4)",
        glass: "0 8px 32px rgb(240 112 151 / 0.10)",
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(.22,1,.36,1)",
      },
    },
  },
  plugins: [],
};
export default config;
