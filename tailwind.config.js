/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Heebo', 'sans-serif'],
      },
      colors: {
        primary: '#0f172a', // slate-900
        secondary: '#64748b', // slate-500
        accent: '#2563eb', // blue-600
      }
    },
  },
  plugins: [],
}
