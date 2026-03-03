/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        editor: {
          bg: '#1a1a2e',
          sidebar: '#16213e',
          panel: '#0f3460',
          accent: '#e94560',
        }
      }
    },
  },
  plugins: [],
}
