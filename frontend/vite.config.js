import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { copyFileSync } from 'fs';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-service-worker',
      writeBundle() {
        copyFileSync(
          'public/service-worker.js',
          '../backend/public/service-worker.js'
        );
      }
    }
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: '../backend/public',
    emptyOutDir: true
  }
});
