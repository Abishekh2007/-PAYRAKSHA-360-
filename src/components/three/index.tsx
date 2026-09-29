// STUB: replaced by the three task. Pages import only from this file; keep these exports and props.
// Contract: every component renders a CSS fallback when WebGL is unavailable (jsdom, old devices), is aria-hidden
// decoration, and lazy-loads its three.js code so the first page load stays light.
import type { RiskLevelId, RobotMood } from '../../types';

export interface GuardianRobotProps {
  /** idle, wave (greeting), thinking (analysing), alert (risk found), safe (low risk), celebrate. Default idle. */
  mood?: RobotMood;
  className?: string;
  /** Allow drag-to-rotate. Default false. */
  interactive?: boolean;
}
export function GuardianRobot({ mood = 'idle', className = '' }: GuardianRobotProps) {
  return <div aria-hidden="true" data-robot-mood={mood} className={className} />;
}

export interface EngineCoreProps {
  /** Glow colour follows the risk level; null = neutral brand blue. */
  level?: RiskLevelId | null;
  /** Spinning fast while analysing. */
  active?: boolean;
  className?: string;
}
export function EngineCore({ level = null, active = false, className = '' }: EngineCoreProps) {
  return <div aria-hidden="true" data-engine-level={level ?? 'idle'} data-active={active} className={className} />;
}

export interface HeroSceneProps { className?: string }
export function HeroScene({ className = '' }: HeroSceneProps) {
  return <div aria-hidden="true" data-hero-scene className={className} />;
}

/** True when a WebGL context can be created. Always false in jsdom. */
export function supportsWebGL(): boolean {
  return false;
}
