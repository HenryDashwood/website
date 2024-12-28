import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        navBackground: "#faad19",
      },
      fontFamily: {
        martinaPlantijn: "var(--font-martina-plantijn)",
        arizonaFlare: "var(--font-arizona-flare)",
        malloryBook: "var(--font-mallory-book)",
      },
    },
  },
  plugins: [typography],
} satisfies Config;
export default config;
