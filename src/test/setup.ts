import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import { useDemoStore } from '../store/demoStore';

afterEach(() => {
  cleanup();
  useDemoStore.getState().resetDemo();
});

// jsdom lacks these browser APIs; framer-motion, recharts and three expect them to exist.
class ResizeObserverMock { observe() {} unobserve() {} disconnect() {} }
class IntersectionObserverMock {
  readonly root = null;
  readonly rootMargin = '';
  readonly thresholds: number[] = [];
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() { return []; }
}
const g = globalThis as Record<string, unknown>;
g.ResizeObserver ??= ResizeObserverMock;
g.IntersectionObserver ??= IntersectionObserverMock;
if (typeof window !== 'undefined') {
  window.matchMedia ??= ((query: string) => ({
    matches: false, media: query, onchange: null,
    addListener: () => {}, removeListener: () => {}, addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
  window.scrollTo = (() => {}) as unknown as typeof window.scrollTo;
  Element.prototype.scrollIntoView ??= function scrollIntoView() {};
  // No WebGL / 2D canvas in jsdom: 3D components must render their fallback.
  HTMLCanvasElement.prototype.getContext = (() => null) as unknown as typeof HTMLCanvasElement.prototype.getContext;
  URL.createObjectURL ??= (() => 'blob:payraksha-demo') as typeof URL.createObjectURL;
  URL.revokeObjectURL ??= (() => {}) as typeof URL.revokeObjectURL;
}
