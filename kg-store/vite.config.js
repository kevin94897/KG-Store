import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({ 
  plugins: [react()], 
  server: { host: '0.0.0.0' },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Separamos React y Supabase del resto de vendors para mejor cacheo
            if (id.includes('react')) return 'v-react';
            if (id.includes('@supabase')) return 'v-supabase';
            if (id.includes('lucide-react') || id.includes('embla-carousel') || id.includes('react-zoom-pan-pinch')) {
              return 'v-ui';
            }
            return 'vendor';
          }
        }
      }
    }
  }
})
