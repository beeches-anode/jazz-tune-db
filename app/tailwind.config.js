/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: '#f4ede1',
        ink: '#141210',
        rule: '#141210',
        accent: '#d8321f',
        muted: '#6b6459',
        'muted-soft': '#a39a8c',
        'jazz-blue': '#1e3a8a', // Editor routes only
      },
      fontFamily: {
        sans: ['Inter Tight', 'Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
