export default {
  content: ["./index.html","./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: { sans: ['Manrope','sans-serif'] },
      colors: {
        accent: '#CCFF00',
        dark: { DEFAULT: '#0A0A0A', 800: '#111111', 700: '#191919', 600: '#222222', 500: '#2E2E2E' },
      }
    }
  },
  plugins: []
}
