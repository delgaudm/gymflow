import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { copyFileSync } from 'fs';

export default defineConfig({
  base: '/gym/',
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
      '/gym/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/gym/, '')
      }
    }
  },
  build: {
    outDir: '../backend/public',
    emptyOutDir: true
  }
});
