// CSS fallbacks for 3D components — no three.js imports
import React from 'react';
import { Bot, ShieldCheck } from 'lucide-react';
import type { RiskLevelId, RobotMood } from '../../types';

// Mood -> ring colour (matches level colours in design)
const MOOD_COLORS: Record<RobotMood, string> = {
  idle: '#22d3ee',
  wave: '#22d3ee',
  thinking: '#3b82f6',
  alert: '#ef4444',
  safe: '#22c55e',
  celebrate: '#22c55e',
};

// Level -> glow colour
const LEVEL_COLORS: Record<string, string> = {
  LOW: '#22c55e',
  CAUTION: '#f59e0b',
  HIGH_CAUTION: '#f97316',
  HIGH: '#ef4444',
};

// ---- Robot fallback --------------------------------------------------------
export interface RobotFallbackProps {
  mood: RobotMood;
}
export function RobotFallback({ mood }: RobotFallbackProps) {
  const color = MOOD_COLORS[mood] ?? '#22d3ee';

  return (
    <div
      className="flex items-center justify-center w-full h-full"
      style={{ minHeight: 180 }}
    >
      <style>{`
        @keyframes fallback-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes fallback-ring-pulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.08); }
        }
        @media (prefers-reduced-motion: reduce) {
          .fb-float { animation: none !important; }
          .fb-ring { animation: none !important; }
        }
      `}</style>
      <div
        className="fb-float relative flex items-center justify-center"
        style={{
          animation: 'fallback-float 3s ease-in-out infinite',
          width: 80,
          height: 80,
        }}
      >
        {/* outer ring */}
        <div
          className="fb-ring absolute rounded-full"
          style={{
            width: 80,
            height: 80,
            border: `2px solid ${color}`,
            opacity: 0.4,
            animation: 'fallback-ring-pulse 2s ease-in-out infinite',
          }}
        />
        {/* middle ring */}
        <div
          className="fb-ring absolute rounded-full"
          style={{
            width: 60,
            height: 60,
            border: `1.5px solid ${color}`,
            opacity: 0.3,
            animation: 'fallback-ring-pulse 2s ease-in-out infinite 0.5s',
          }}
        />
        {/* icon */}
        <div
          className="relative z-10 flex flex-col items-center gap-0.5"
          style={{ color }}
        >
          <Bot size={28} />
          <ShieldCheck size={14} />
        </div>
      </div>
    </div>
  );
}

// ---- Engine Core fallback --------------------------------------------------
export interface EngineFallbackProps {
  level: RiskLevelId | null;
  active: boolean;
}
export function EngineFallback({ level, active }: EngineFallbackProps) {
  const color = (level && LEVEL_COLORS[level]) ?? '#3b82f6';
  const spinDuration = active ? '1s' : '4s';

  return (
    <div
      className="flex items-center justify-center w-full h-full"
      style={{ minHeight: 140 }}
    >
      <style>{`
        @keyframes engine-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes engine-pulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.12); }
        }
        @media (prefers-reduced-motion: reduce) {
          .eng-spin { animation: none !important; }
          .eng-pulse { animation: none !important; }
        }
      `}</style>
      <div className="relative flex items-center justify-center" style={{ width: 80, height: 80 }}>
        {/* outer ring */}
        <div
          className="eng-spin absolute rounded-full"
          style={{
            width: 80,
            height: 80,
            border: `2px dashed ${color}`,
            opacity: 0.5,
            animation: `engine-spin ${spinDuration} linear infinite`,
          }}
        />
        {/* mid ring */}
        <div
          className="eng-spin absolute rounded-full"
          style={{
            width: 58,
            height: 58,
            border: `1.5px solid ${color}`,
            opacity: 0.4,
            animation: `engine-spin ${spinDuration} linear infinite reverse`,
          }}
        />
        {/* core dot */}
        <div
          className="eng-pulse absolute rounded-full"
          style={{
            width: 22,
            height: 22,
            background: color,
            opacity: active ? 1 : 0.6,
            animation: active ? `engine-pulse 0.8s ease-in-out infinite` : `engine-pulse 2.5s ease-in-out infinite`,
          }}
        />
      </div>
    </div>
  );
}

// ---- Hero fallback ---------------------------------------------------------
export function HeroFallback() {
  return (
    <div
      className="grid-overlay w-full h-full flex items-center justify-center relative overflow-hidden"
      style={{ minHeight: 240 }}
    >
      <style>{`
        @keyframes hero-glow {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
        @keyframes hero-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @media (prefers-reduced-motion: reduce) {
          .hero-glow { animation: none !important; }
          .hero-float { animation: none !important; }
        }
      `}</style>
      {/* radial gradient layers */}
      <div
        className="hero-glow absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 60%, #3b82f640 0%, transparent 70%)',
          animation: 'hero-glow 3s ease-in-out infinite',
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 30% 40%, #22d3ee20 0%, transparent 60%)',
        }}
      />
      {/* floating robot */}
      <div
        className="hero-float relative z-10 flex flex-col items-center gap-2"
        style={{ animation: 'hero-float 4s ease-in-out infinite', color: '#22d3ee' }}
      >
        <div
          className="rounded-full p-4"
          style={{ background: 'rgba(34,211,238,0.1)', border: '1.5px solid #22d3ee40' }}
        >
          <Bot size={40} />
        </div>
        <ShieldCheck size={20} style={{ color: '#22c55e' }} />
      </div>
    </div>
  );
}
