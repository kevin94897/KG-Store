export default {
  content: ["./index.html","./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: { sans: ['Manrope','sans-serif'] },
      colors: {
        accent: '#CCFF00',
        dark: { DEFAULT: '#0E0E0E', 800: '#141414', 700: '#1C1C1C', 600: '#252525', 500: '#333' },
      },
      screens: { xs: '375px' }
    }
  },
  plugins: []
}
