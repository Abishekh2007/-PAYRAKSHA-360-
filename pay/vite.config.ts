// RakshaPay DEMO: the phone app. Dev on :5174 (npm run dev:pay), builds to dist-pay/, API proxied to the backend on :8000.
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import payTailwind from './tailwind.config';

const api = { '/api': { target: 'http://127.0.0.1:8000', changeOrigin: true } };
// `tailscale serve` gives the phone https://<machine>.<tailnet>.ts.net; Vite must accept that Host header.
const allowedHosts = ['.ts.net', 'localhost', '127.0.0.1'];

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  plugins: [react()],
  css: { postcss: { plugins: [tailwindcss(payTailwind), autoprefixer()] } },
  server: {
    port: 5174,
    strictPort: true,
    proxy: api,
    allowedHosts,
    // The app imports the engine and the QR service from ../src and ../shared.
    fs: { allow: [fileURLToPath(new URL('..', import.meta.url))] },
    watch: { ignored: ['**/.orchestra/**', '**/.wt/**', '**/backend/**'] },
  },
  preview: { port: 4174, strictPort: true, proxy: api, allowedHosts },
  build: { outDir: '../dist-pay', emptyOutDir: true, chunkSizeWarningLimit: 2500 },
});
