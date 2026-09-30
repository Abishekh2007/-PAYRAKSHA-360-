// RakshaPay DEMO tokens: a light, GPay-style Material look. Content paths are absolute so this config works from any cwd.
import type { Config } from 'tailwindcss';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('.', import.meta.url)).replace(/\\/g, '/');

export default {
  content: [`${here}index.html`, `${here}src/**/*.{ts,tsx}`, `${here}../src/theme/**/*.tsx`, `${here}../src/components/vendor/**/*.tsx`],
  theme: {
    extend: {
      colors: {
        gp: {
          blue: 'rgb(var(--c-700) / <alpha-value>)',
          'blue-soft': 'rgb(var(--c-100) / <alpha-value>)',
          'blue-ink': 'rgb(var(--c-950) / <alpha-value>)',
          bg: '#ffffff',
          surface: '#f0f4f9',
          'surface-2': '#e9eef6',
          ink: '#1f1f1f',
          'ink-2': '#444746',
          'ink-3': '#747775',
          line: '#c4c7c5',
        },
        // Risk colours on white: base = strokes and fills, soft = tinted backgrounds, ink = text on soft.
        risk: {
          low: '#1e8e3e', 'low-soft': '#e6f4ea', 'low-ink': '#137333',
          caution: '#f29900', 'caution-soft': '#fef7e0', 'caution-ink': '#b06000',
          elevated: '#e8710a', 'elevated-soft': '#feefe3', 'elevated-ink': '#b3470c',
          high: '#d93025', 'high-soft': '#fce8e6', 'high-ink': '#a50e0e',
        },
      },
      fontFamily: {
        sans: ['"Inter Variable"', 'Inter', 'Roboto', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(60, 64, 67, 0.12), 0 1px 3px 1px rgba(60, 64, 67, 0.08)',
        float: '0 6px 16px rgba(11, 87, 208, 0.28), 0 2px 6px rgba(60, 64, 67, 0.2)',
        sheet: '0 -8px 24px rgba(60, 64, 67, 0.18)',
      },
      keyframes: {
        'scan-line': { '0%': { top: '8%' }, '100%': { top: '88%' } },
        'fade-up': { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        'pulse-soft': { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.45' } },
      },
      animation: {
        'scan-line': 'scan-line 1.8s ease-in-out infinite alternate',
        'fade-up': 'fade-up 0.35s ease-out both',
        'pulse-soft': 'pulse-soft 1.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;
