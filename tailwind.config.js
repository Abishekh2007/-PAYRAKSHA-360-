/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: { 950: '#030817', 900: '#071029', 850: '#0a1633', 800: '#0d1b3e', 700: '#13265a', 600: '#1b3478', 500: '#25449a' },
        brand: { 200: '#bae6fd', 300: '#7dd3fc', 400: '#38bdf8', 500: '#0ea5e9', 600: '#0284c7' },
        risk: { low: '#22c55e', caution: '#f59e0b', elevated: '#f97316', high: '#ef4444' },
      },
      fontFamily: {
        sans: ['"Inter Variable"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', '"Inter Variable"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        glass: '0 8px 32px rgba(2, 6, 23, 0.45)',
        'glow-brand': '0 0 40px rgba(56, 189, 248, 0.35)',
        'glow-low': '0 0 40px rgba(34, 197, 94, 0.35)',
        'glow-caution': '0 0 40px rgba(245, 158, 11, 0.35)',
        'glow-elevated': '0 0 40px rgba(249, 115, 22, 0.4)',
        'glow-high': '0 0 48px rgba(239, 68, 68, 0.45)',
      },
      keyframes: {
        float: { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
        'pulse-ring': { '0%': { transform: 'scale(0.9)', opacity: '0.8' }, '100%': { transform: 'scale(1.6)', opacity: '0' } },
        scan: { '0%': { transform: 'translateY(0%)' }, '100%': { transform: 'translateY(100%)' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        'spin-slow': { to: { transform: 'rotate(360deg)' } },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        'pulse-ring': 'pulse-ring 1.8s ease-out infinite',
        scan: 'scan 2s linear infinite alternate',
        shimmer: 'shimmer 2.5s linear infinite',
        'spin-slow': 'spin-slow 12s linear infinite',
      },
    },
  },
  plugins: [],
};
