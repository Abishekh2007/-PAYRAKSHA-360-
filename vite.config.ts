import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

const api = { '/api': { target: 'http://127.0.0.1:8000', changeOrigin: true } };

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: api,
    watch: { ignored: ['**/.orchestra/**', '**/.wt/**', '**/backend/**'] },
  },
  preview: { port: 4173, proxy: api },
  build: { chunkSizeWarningLimit: 2500 },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'test/**/*.test.{ts,tsx,js,mjs}'],
    exclude: ['**/node_modules/**', '**/.orchestra/**', '**/.wt/**', '**/dist/**'],
    css: false,
    passWithNoTests: true,
    testTimeout: 20000,
  },
});
