/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "var(--font-inter)", "var(--font-geist-sans)", "-apple-system", "BlinkMacSystemFont", "'SF Pro Display'", "'SF Pro Text'", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "var(--font-space-mono)", "monospace"],
        geist: ["var(--font-geist-sans)", "'Geist'", "sans-serif"],
      },
    },
  },
  plugins: [],
};
