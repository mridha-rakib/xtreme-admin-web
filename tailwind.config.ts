import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          canvas: "var(--color-surface-canvas)",
          card: "var(--color-surface-card)",
          inverse: "var(--color-surface-inverse)",
          subtle: "var(--color-surface-subtle)",
          muted: "var(--color-surface-muted)",
        },
        brand: {
          onyx: "var(--color-brand-onyx)",
          carbon: "var(--color-brand-carbon)",
          graphite: "var(--color-brand-graphite)",
          slate: "var(--color-brand-slate)",
          line: "var(--color-brand-line)",
          sand: "var(--color-brand-sand)",
          accent: "var(--color-brand-accent)",
          gold: "var(--color-brand-gold)",
        },
        state: {
          success: "var(--color-state-success)",
          successBg: "var(--color-state-success-bg)",
          warning: "var(--color-state-warning)",
          warningBg: "var(--color-state-warning-bg)",
          danger: "var(--color-state-danger)",
          dangerBg: "var(--color-state-danger-bg)",
          info: "var(--color-state-info)",
          infoBg: "var(--color-state-info-bg)",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        pill: "var(--radius-pill)",
      },
      boxShadow: {
        sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        card: "0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.04)",
        dropdown: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)",
        modal: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
      },
    },
  },
  plugins: [],
};

export default config;
