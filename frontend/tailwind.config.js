/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#111827",
        sand: "#F4EFE6",
        moss: "#244034",
        ember: "#D95D39",
        sky: "#A9D6E5"
      }
    }
  },
  plugins: []
};

