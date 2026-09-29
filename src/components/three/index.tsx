// Public API for the 3D layer. No static three.js imports — they are lazy-loaded per component.
// Pages import only from this file.
import React, {
  lazy,
  Suspense,
  useState,
  useEffect,
  useRef,
  Component,
} from 'react';
import type { RiskLevelId, RobotMood } from '../../types';
import { RobotFallback, EngineFallback, HeroFallback } from './Fallbacks';

// ---- supportsWebGL (memoised) -----------------------------------------------
let _webglResult: boolean | undefined;
/** True when a WebGL context can be created. Always false in jsdom / old devices. */
export function supportsWebGL(): boolean {
  if (_webglResult !== undefined) return _webglResult;
  if (typeof window === 'undefined') { _webglResult = false; return false; }
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('webgl2') || canvas.getContext('webgl');
    _webglResult = ctx !== null;
  } catch {
    _webglResult = false;
  }
  return _webglResult;
}

// ---- Lazy canvas components -------------------------------------------------
const LazyRobotCanvas = lazy(() => import('./RobotCanvas'));
const LazyEngineCoreCanvas = lazy(() => import('./EngineCoreCanvas'));
const LazyHeroCanvas = lazy(() => import('./HeroCanvas'));

// ---- ErrorBoundary ----------------------------------------------------------
interface EBProps { fallback: React.ReactNode; children: React.ReactNode }
interface EBState { hasError: boolean }
class ErrorBoundary extends Component<EBProps, EBState> {
  constructor(props: EBProps) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError(): EBState { return { hasError: true }; }
  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

// ---- Intersection mount hook ------------------------------------------------
function useIntersected(ref: React.RefObject<Element | null>): boolean {
  const [intersected, setIntersected] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!('IntersectionObserver' in window)) { setIntersected(true); return; }
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setIntersected(true); io.disconnect(); } },
      { rootMargin: '100px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);
  return intersected;
}

// ---- Prop interfaces (exported, contract) -----------------------------------
export interface GuardianRobotProps {
  /** idle, wave, thinking, alert, safe, celebrate. Default idle. */
  mood?: RobotMood;
  className?: string;
  /** Allow drag-to-rotate. Default false. */
  interactive?: boolean;
}

export interface EngineCoreProps {
  /** Glow colour follows the risk level; null = neutral brand blue. */
  level?: RiskLevelId | null;
  /** Spinning fast while analysing. */
  active?: boolean;
  className?: string;
}

export interface HeroSceneProps { className?: string }

// ---- GuardianRobot ----------------------------------------------------------
export function GuardianRobot({ mood = 'idle', className = '', interactive = false }: GuardianRobotProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const intersected = useIntersected(wrapperRef);
  const webgl = supportsWebGL();
  const fallback = <RobotFallback mood={mood} />;

  return (
    <div
      ref={wrapperRef}
      aria-hidden="true"
      data-robot-mood={mood}
      className={className}
      style={{ position: 'relative', minHeight: 200 }}
    >
      {fallback /* always in DOM; canvas goes on top */}
      {webgl && intersected && (
        <ErrorBoundary fallback={fallback}>
          <Suspense fallback={null}>
            <LazyRobotCanvas mood={mood} interactive={interactive} />
          </Suspense>
        </ErrorBoundary>
      )}
    </div>
  );
}

// ---- EngineCore -------------------------------------------------------------
export function EngineCore({ level = null, active = false, className = '' }: EngineCoreProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const intersected = useIntersected(wrapperRef);
  const webgl = supportsWebGL();
  const fallback = <EngineFallback level={level ?? null} active={active} />;

  return (
    <div
      ref={wrapperRef}
      aria-hidden="true"
      data-engine-level={level ?? 'idle'}
      data-active={active}
      className={className}
      style={{ position: 'relative', minHeight: 160 }}
    >
      {fallback}
      {webgl && intersected && (
        <ErrorBoundary fallback={fallback}>
          <Suspense fallback={null}>
            <LazyEngineCoreCanvas level={level ?? null} active={active} />
          </Suspense>
        </ErrorBoundary>
      )}
    </div>
  );
}

// ---- HeroScene --------------------------------------------------------------
export function HeroScene({ className = '' }: HeroSceneProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const intersected = useIntersected(wrapperRef);
  const webgl = supportsWebGL();
  const fallback = <HeroFallback />;

  return (
    <div
      ref={wrapperRef}
      aria-hidden="true"
      data-hero-scene
      className={className}
      style={{ position: 'relative', minHeight: 260 }}
    >
      {fallback}
      {webgl && intersected && (
        <ErrorBoundary fallback={fallback}>
          <Suspense fallback={null}>
            <LazyHeroCanvas />
          </Suspense>
        </ErrorBoundary>
      )}
    </div>
  );
}
