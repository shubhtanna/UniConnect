import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        app: "#0A0A0A",
        surface: "#151515",
        elevated: "#1A1A1A",
        line: "#2A2A2A",
        ink: "#F5F5F4",
        muted: "#9CA3AF",
        teal: "#2DD4BF",
        amber: "#FBBF24",
      },
      boxShadow: {
        card: "0 22px 60px rgba(0, 0, 0, 0.35)",
        glow: "0 0 32px rgba(45, 212, 191, 0.16)",
      },
    },
  },
  plugins: [],
};

export default config;
