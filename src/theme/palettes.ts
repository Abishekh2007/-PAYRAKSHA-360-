// Colour palettes shared by the console and RakshaPay. Each palette sets the brand scale as CSS variables
// ("r g b" triplets) that the Tailwind `cyan` / `brand` / `gp-blue` tokens read, so switching is instant and app-wide.
import { useEffect, useState } from 'react';

export interface Palette {
  id: string;
  name: string;
  /** 50..950 brand scale. */
  scale: [string, string, string, string, string, string, string, string, string, string, string];
  /** Gradient stops: start, middle, end. */
  gradient: [string, string, string];
}

export const PALETTES: Palette[] = [
  { id: 'indigo', name: 'Indigo', gradient: ['#6366f1', '#3b82f6', '#22d3ee'],
    scale: ['#eef4ff', '#dce8ff', '#bcd3ff', '#93b7ff', '#6b9bff', '#4f7fff', '#3b63f0', '#2f4fd0', '#2a43a8', '#283d85', '#1b2552'] },
  { id: 'emerald', name: 'Emerald', gradient: ['#059669', '#10b981', '#84cc16'],
    scale: ['#ecfdf5', '#d1fae5', '#a7f3d0', '#6ee7b7', '#34d399', '#10b981', '#059669', '#047857', '#065f46', '#064e3b', '#022c22'] },
  { id: 'sunset', name: 'Sunset', gradient: ['#f43f5e', '#f97316', '#facc15'],
    scale: ['#fff7ed', '#ffedd5', '#fed7aa', '#fdba74', '#fb923c', '#f97316', '#ea580c', '#c2410c', '#9a3412', '#7c2d12', '#431407'] },
  { id: 'ocean', name: 'Ocean', gradient: ['#0ea5e9', '#06b6d4', '#14b8a6'],
    scale: ['#ecfeff', '#cffafe', '#a5f3fc', '#67e8f9', '#22d3ee', '#06b6d4', '#0891b2', '#0e7490', '#155e75', '#164e63', '#083344'] },
  { id: 'rose', name: 'Rose', gradient: ['#db2777', '#e11d48', '#f97316'],
    scale: ['#fdf2f8', '#fce7f3', '#fbcfe8', '#f9a8d4', '#f472b6', '#ec4899', '#db2777', '#be185d', '#9d174d', '#831843', '#500724'] },
  { id: 'violet', name: 'Violet', gradient: ['#7c3aed', '#a855f7', '#ec4899'],
    scale: ['#f5f3ff', '#ede9fe', '#ddd6fe', '#c4b5fd', '#a78bfa', '#8b5cf6', '#7c3aed', '#6d28d9', '#5b21b6', '#4c1d95', '#2e1065'] },
];

const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
const KEY = 'payraksha.palette';

const rgb = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
};

export function applyPalette(id: string): Palette {
  const p = PALETTES.find((x) => x.id === id) ?? PALETTES[0];
  if (typeof document === 'undefined') return p;
  const s = document.documentElement.style;
  p.scale.forEach((hex, i) => s.setProperty(`--c-${STEPS[i]}`, rgb(hex)));
  p.gradient.forEach((hex, i) => s.setProperty(`--g-${i}`, hex));
  s.setProperty('--brand-gradient', `linear-gradient(135deg, ${p.gradient[0]} 0%, ${p.gradient[1]} 55%, ${p.gradient[2]} 100%)`);
  return p;
}

export function savedPalette(): string {
  try { return localStorage.getItem(KEY) ?? 'indigo'; } catch { return 'indigo'; }
}

export function initPalette() { applyPalette(savedPalette()); }

export function usePalette(): [string, (id: string) => void] {
  const [id, setId] = useState(savedPalette);
  useEffect(() => { applyPalette(id); try { localStorage.setItem(KEY, id); } catch { /* private mode */ } }, [id]);
  return [id, setId];
}

/** Tailwind colour scale that reads the palette variables. */
export const cssScale = Object.fromEntries(STEPS.map((s) => [s, `rgb(var(--c-${s}) / <alpha-value>)`]));
