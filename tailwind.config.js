/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // SOC console: near-black surfaces (kept under the old `navy` name so every page re-skins at once).
        navy: { 950: '#03060c', 900: '#060b15', 850: '#08101d', 800: '#0b1526', 700: '#12213a', 600: '#1a2d4d', 500: '#253d63' },
        // System accent is cyan (was sky blue).
        brand: { 200: '#a5f3fc', 300: '#67e8f9', 400: '#22d3ee', 500: '#06b6d4', 600: '#0891b2' },
        risk: { low: '#22c55e', caution: '#f59e0b', elevated: '#f97316', high: '#ef4444' },
        soc: {
          void: '#03060c',
          deep: '#060b15',
          panel: '#0a1220',
          line: '#123047',
          cyan: '#22d3ee',
          violet: '#a78bfa',
          muted: '#64748b',
        },
      },
      fontFamily: {
        sans: ['"Inter Variable"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        glass: '0 18px 40px -24px rgba(0, 0, 0, 0.85)',
        'glow-brand': '0 0 28px rgba(34, 211, 238, 0.35)',
        'glow-low': '0 0 32px rgba(34, 197, 94, 0.35)',
        'glow-caution': '0 0 32px rgba(245, 158, 11, 0.35)',
        'glow-elevated': '0 0 32px rgba(249, 115, 22, 0.4)',
        'glow-high': '0 0 40px rgba(239, 68, 68, 0.45)',
        'glow-violet': '0 0 28px rgba(167, 139, 250, 0.35)',
      },
      keyframes: {
        float: { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
        'pulse-ring': { '0%': { transform: 'scale(0.9)', opacity: '0.8' }, '100%': { transform: 'scale(1.6)', opacity: '0' } },
        scan: { '0%': { transform: 'translateY(0%)' }, '100%': { transform: 'translateY(100%)' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        'spin-slow': { to: { transform: 'rotate(360deg)' } },
        'radar-sweep': { to: { transform: 'rotate(360deg)' } },
        'dash-flow': { to: { strokeDashoffset: '-24' } },
        ticker: { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(-50%)' } },
        blink: { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.25' } },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        'pulse-ring': 'pulse-ring 1.8s ease-out infinite',
        scan: 'scan 2s linear infinite alternate',
        shimmer: 'shimmer 2.5s linear infinite',
        'spin-slow': 'spin-slow 12s linear infinite',
        'radar-sweep': 'radar-sweep 4s linear infinite',
        'dash-flow': 'dash-flow 1.2s linear infinite',
        ticker: 'ticker 90s linear infinite',
        blink: 'blink 1.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
