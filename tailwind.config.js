/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./*.html"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f3f1ff',
          100: '#e9e4ff',
          200: '#d4caff',
          300: '#b7a1ff',
          400: '#9671ff',
          500: '#7b4eff',
          600: '#6d2fff',
          700: '#5d1ef7',
          800: '#4e19d2',
          900: '#4016ab',
        }
      }
    },
  },
  plugins: [],
}