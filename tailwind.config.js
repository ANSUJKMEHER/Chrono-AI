/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1', // Indigo primary
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        obsidian: {
          950: '#07080B',
          900: '#0B0C12',
          850: '#10121B',
          800: '#161925',
          750: '#1D2132',
          700: '#262B40',
        },
      },
      boxShadow: {
        'glow-indigo': '0 0 25px -5px rgba(99, 102, 241, 0.35)',
        'glow-rose': '0 0 25px -5px rgba(244, 63, 94, 0.35)',
        'glow-emerald': '0 0 25px -5px rgba(16, 185, 129, 0.35)',
        'inner-light': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.08)',
        'card-elevated': '0 4px 20px -2px rgba(0, 0, 0, 0.15), 0 2px 6px -1px rgba(0, 0, 0, 0.1)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Menlo', 'Monaco', 'Courier New', 'monospace'],
      }
    },
  },
  plugins: [],
}
