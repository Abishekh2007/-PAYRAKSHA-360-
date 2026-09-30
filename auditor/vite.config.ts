// PAYRAKSHA AI Auditor portal (bank-internal, server side). Dev on :5175, builds to dist-auditor/, API proxied to :8000.
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
// @ts-expect-error untyped JS config
import rootTailwind from '../tailwind.config.js';

const api = { '/api': { target: 'http://127.0.0.1:8000', changeOrigin: true } };
const here = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  root: here,
  plugins: [react()],
  css: { postcss: { plugins: [tailwindcss({ ...rootTailwind, content: [`${here}index.html`, `${here}src/**/*.{ts,tsx}`] }), autoprefixer()] } },
  server: { port: 5175, strictPort: true, proxy: api, fs: { allow: [fileURLToPath(new URL('..', import.meta.url))] } },
  preview: { port: 4175, strictPort: true, proxy: api },
  build: { outDir: '../dist-auditor', emptyOutDir: true, chunkSizeWarningLimit: 2500 },
});
