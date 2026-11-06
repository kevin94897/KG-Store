export default {
  content: ["./index.html","./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: { sans: ['Manrope','sans-serif'] },
      colors: {
        accent: '#CCFF00',
        // Texto (contraste sobre surface #141417)
        ink: {
          DEFAULT: '#F4F4F5', // 16.7:1 — títulos, valores
          2: '#B8B8BF',       //  9.3:1 — texto secundario
          3: '#8E8E96',       //  5.7:1 — etiquetas, placeholders, fechas
          4: '#6E6E76',       //  3.6:1 — solo iconos / decorativo
        },
        // Fondos
        canvas: '#0B0B0D',
        surface: { DEFAULT: '#141417', 2: '#1C1C21', 3: '#24242A' },
        // Bordes
        line: { DEFAULT: '#2A2A31', 2: '#3A3A42' },
        dark: { DEFAULT: '#0B0B0D', 800: '#141417', 700: '#1C1C21', 600: '#24242A', 500: '#2E2E35' },
      }
    }
  },
  plugins: []
}
