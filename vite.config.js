import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    // Proxy doar pentru development
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  },
  // Configurare pentru build
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser'
  }
});
