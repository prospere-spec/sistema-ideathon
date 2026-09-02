import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "var(--color-surface)",
          dim: "var(--color-surface-dim)",
          bright: "var(--color-surface-bright)",
          lowest: "var(--color-surface-container-lowest)",
          low: "var(--color-surface-container-low)",
          container: "var(--color-surface-container)",
          high: "var(--color-surface-container-high)",
          highest: "var(--color-surface-container-highest)",
        },
        ink: {
          DEFAULT: "var(--color-on-surface)",
          muted: "var(--color-on-surface-variant)",
        },
        primary: {
          DEFAULT: "var(--color-primary)",
          foreground: "var(--color-on-primary)",
          container: "var(--color-primary-container)",
        },
        lime: {
          DEFAULT: "var(--color-secondary-container)",
          deep: "var(--color-secondary)",
          foreground: "var(--color-on-secondary-fixed)",
        },
        indigo: {
          DEFAULT: "var(--color-on-tertiary-container)",
          deep: "var(--color-tertiary-container)",
        },
        danger: {
          DEFAULT: "var(--color-error)",
          soft: "var(--color-error-container)",
        },
        outline: "var(--color-outline-variant)",
      },
      fontFamily: {
        sans: ["var(--font-jakarta)", "sans-serif"],
      },
      borderRadius: {
        sm: "4px",
        DEFAULT: "8px",
        md: "12px",
        lg: "16px",
        xl: "24px",
      },
      boxShadow: {
        card: "0 4px 20px rgba(0, 0, 0, 0.03)",
        popover: "0 12px 40px rgba(0, 0, 0, 0.08)",
      },
      maxWidth: {
        container: "1440px",
      },
    },
  },
  plugins: [],
};

export default config;
