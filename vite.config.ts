import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
  publicDir: 'Public',
  optimizeDeps: {
    include: ['@appletosolutions/reactbits'],
  },
  plugins: [
    basicSsl(), // HTTPS — нужен для запроса датчика на iPhone (Safari)
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],

  server: {
    host: '0.0.0.0', // доступ с iPhone в той же Wi‑Fi сети
    port: 5173,
    strictPort: false,
  },
})
