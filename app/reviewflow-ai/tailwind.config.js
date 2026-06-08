/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "var(--brand-color, #6d28d9)",
          fg: "var(--brand-fg, #ffffff)",
        },
      },
      fontFamily: {
        sans: ["Heebo", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
