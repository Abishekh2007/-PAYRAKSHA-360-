/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Futuristic digital bank: midnight surfaces (kept under the old `navy` name so every page re-skins at once).
        navy: { 950: '#050816', 900: '#070b1d', 850: '#0a1026', 800: '#0e1530', 700: '#151e42', 600: '#1e2a57', 500: '#2b3a73' },
        // `cyan-*` is remapped to the brand blue scale: pages use cyan-* utilities as the system colour.
        cyan: {
          50: '#eef4ff', 100: '#dce8ff', 200: '#bcd3ff', 300: '#93b7ff', 400: '#6b9bff',
          500: '#4f7fff', 600: '#3b63f0', 700: '#2f4fd0', 800: '#2a43a8', 900: '#283d85', 950: '#1b2552',
        },
        // True aqua (the end of the brand gradient) for the few places that need it.
        aqua: { 200: '#a5f3fc', 300: '#67e8f9', 400: '#22d3ee', 500: '#06b6d4' },
        brand: { 200: '#bcd3ff', 300: '#93b7ff', 400: '#6b9bff', 500: '#4f7fff', 600: '#3b63f0', indigo: '#6366f1', blue: '#3b82f6', aqua: '#22d3ee' },
        risk: { low: '#22c55e', caution: '#f59e0b', elevated: '#f97316', high: '#ef4444' },
        soc: {
          void: '#050816',
          deep: '#070b1d',
          panel: '#0c1330',
          line: '#1d2750',
          cyan: '#6b9bff',
          violet: '#a78bfa',
          muted: '#7c86a8',
        },
      },
      fontFamily: {
        sans: ['"Inter Variable"', 'Inter', 'system-ui', 'sans-serif'],
        // Headings, labels and figures: Space Grotesk. `font-mono` is remapped to it so every page re-skins at once.
        display: ['"Space Grotesk"', '"Inter Variable"', 'system-ui', 'sans-serif'],
        mono: ['"Space Grotesk"', '"Inter Variable"', 'system-ui', 'sans-serif'],
        // Real monospace, only for raw payloads (QR text, JSON, ids).
        code: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        sm: '0.5rem',
        DEFAULT: '0.625rem',
        md: '0.75rem',
        lg: '0.875rem',
        xl: '1rem',
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      },
      boxShadow: {
        glass: '0 24px 60px -30px rgba(2, 6, 23, 0.9)',
        card: 'inset 0 1px 0 rgba(255, 255, 255, 0.06), 0 24px 48px -28px rgba(0, 0, 0, 0.85)',
        'glow-brand': '0 12px 36px -12px rgba(79, 127, 255, 0.65)',
        'glow-low': '0 12px 36px -12px rgba(34, 197, 94, 0.55)',
        'glow-caution': '0 12px 36px -12px rgba(245, 158, 11, 0.55)',
        'glow-elevated': '0 12px 36px -12px rgba(249, 115, 22, 0.6)',
        'glow-high': '0 12px 40px -12px rgba(239, 68, 68, 0.65)',
        'glow-violet': '0 12px 36px -12px rgba(167, 139, 250, 0.55)',
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
        aurora: {
          '0%, 100%': { transform: 'translate3d(0, 0, 0) scale(1)' },
          '50%': { transform: 'translate3d(3%, -4%, 0) scale(1.08)' },
        },
        'gradient-x': { '0%, 100%': { backgroundPosition: '0% 50%' }, '50%': { backgroundPosition: '100% 50%' } },
        'fade-up': { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
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
        aurora: 'aurora 18s ease-in-out infinite',
        'gradient-x': 'gradient-x 8s ease infinite',
        'fade-up': 'fade-up 0.4s ease-out both',
      },
    },
  },
  plugins: [],
};
