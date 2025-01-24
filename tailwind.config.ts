import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class", // Use class-based dark mode
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}", // Ensure all src folders are scanned
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: "var(--card-background)",
        shadow: "var(--card-shadow)",
        textPrimary: "var(--foreground)",
        textSecondary: "var(--text-secondary)",
      },
      textColor: {
        skin: {
          base: "var(--foreground)",
          muted: "var(--text-secondary)",
        },
      },
      backgroundColor: {
        skin: {
          fill: "var(--background)",
          card: "var(--card-background)",
        },
      },
      borderColor: {
        skin: {
          base: "var(--card-shadow)",
        },
      },
      animation: {
        //ping: "ping 0.5s ease-out",
        //bounce: "bounce 0.5s ease-in-out",
        pulse: "pulse 1s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
