import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'
import { persistVideoUploadsPlugin } from './scripts/persistVideoUploadsPlugin.js'

// persistVideoUploadsPlugin: writes uploads to public/assets + 404s missing video assets
export default defineConfig({
  logLevel: 'info',
  base: './',
  plugins: [react(), persistVideoUploadsPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    // IPv4 loopback — default Vite on macOS often listens on IPv6 [::1] only, so 127.0.0.1 refused.
    host: '127.0.0.1',
  },
  preview: {
    port: 4173,
    strictPort: true,
    host: '127.0.0.1',
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/framer-motion')) return 'motion';
          if (id.includes('node_modules/@radix-ui')) return 'radix';
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react-router')) return 'react-vendor';
        },
      },
    },
  },
});
