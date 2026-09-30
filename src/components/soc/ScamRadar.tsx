import { useReducedMotion } from 'framer-motion';
import type { SimEvent } from './simFeed';
import { SIM_CHANNELS, STATUS_LABEL } from './simFeed';
import { socToneForLevel, SOC_TONES } from './tones';

/**
 * Normalised distance of a blip from the radar centre, in [0.08, 0.92]. Higher risk sits closer to the centre.
 *   radarDistance(s) = round to 3 decimals of (0.92 - 0.84 * clamp(s, 0, 100) / 100)
 * Examples: 0 → 0.92, 50 → 0.5, 92 → 0.147, 100 → 0.08, 150 → 0.08, -5 → 0.92.
 */
export function radarDistance(score: number): number {
  const clamped = Math.max(0, Math.min(100, score));
  return Math.round((0.92 - 0.84 * clamped / 100) * 1000) / 1000;
}

export interface ScamRadarProps {
  events: SimEvent[];
  activeId?: string | null;
  onSelect?: (event: SimEvent) => void;
  /** Rotating sweep beam. Default true. */
  sweep?: boolean;
  className?: string;
}

const LEVEL_COLORS: Record<string, string> = {
  HIGH: '#ef4444',
  HIGH_CAUTION: '#f97316',
  CAUTION: '#f59e0b',
  LOW: '#22c55e',
};

const CX = 200;
const CY = 200;
const R = 180;

/** Convert polar (sector index 0-7, normalized distance 0-1, optional angle offset in degrees) to SVG x/y */
function polarToXY(sectorIdx: number, dist: number, angleOffsetDeg: number = 0): { x: number; y: number } {
  // Sector i occupies 45 degrees; sector centre is at (i * 45 + 22.5) degrees, starting from top (−90 deg offset)
  const sectorCentre = sectorIdx * 45 + 22.5 - 90;
  const angleDeg = sectorCentre + angleOffsetDeg;
  const angleRad = (angleDeg * Math.PI) / 180;
  const radius = dist * R;
  return {
    x: CX + radius * Math.cos(angleRad),
    y: CY + radius * Math.sin(angleRad),
  };
}

/** Deterministic angle offset within ±15 degrees from event index */
function blipAngleOffset(index: number): number {
  // Simple hash: map index to a value in [-15, 15]
  return ((index * 137) % 31) - 15;
}

/**
 * SOC radar of simulated scam contacts.
 */
export function ScamRadar({ events, activeId, onSelect, sweep = true, className = '' }: ScamRadarProps) {
  const reducedMotion = useReducedMotion();

  return (
    <div data-testid="scam-radar" className={`flex flex-col gap-3 ${className}`}>
      {/* SVG radar */}
      <svg
        role="img"
        aria-label="Scam radar (simulation)"
        viewBox="0 0 400 400"
        width="100%"
        style={{ display: 'block' }}
      >
        {/* Background */}
        <rect width="400" height="400" fill="transparent" />

        {/* Range rings */}
        {[0.25, 0.5, 0.75, 1.0].map((fraction) => {
          const ringR = fraction * R;
          const labelDeg = -90; // top
          const labelRad = (labelDeg * Math.PI) / 180;
          const lx = CX + ringR * Math.cos(labelRad);
          const ly = CY + ringR * Math.sin(labelRad) - 3;
          return (
            <g key={fraction}>
              <circle
                cx={CX}
                cy={CY}
                r={ringR}
                fill="none"
                stroke="#22d3ee"
                strokeOpacity={0.2}
                strokeWidth={1}
                strokeDasharray="4 4"
              />
              <text
                x={lx}
                y={ly}
                textAnchor="middle"
                fontSize={9}
                letterSpacing={1.5}
                fill="#22d3ee"
                fillOpacity={0.5}
                className="font-mono"
                fontFamily="monospace"
              >
                {Math.round(fraction * 100)}
              </text>
            </g>
          );
        })}

        {/* Crosshair */}
        <line x1={CX} y1={CY - R} x2={CX} y2={CY + R} stroke="#22d3ee" strokeOpacity={0.15} strokeWidth={1} />
        <line x1={CX - R} y1={CY} x2={CX + R} y2={CY} stroke="#22d3ee" strokeOpacity={0.15} strokeWidth={1} />

        {/* Sector dividers and labels */}
        {SIM_CHANNELS.map((channel, i) => {
          // Sector boundary angle: i * 45 - 90 degrees
          const boundaryDeg = i * 45 - 90;
          const boundaryRad = (boundaryDeg * Math.PI) / 180;
          const bx = CX + R * Math.cos(boundaryRad);
          const by = CY + R * Math.sin(boundaryRad);

          // Sector label at the rim, centred in sector
          const labelDeg = i * 45 + 22.5 - 90;
          const labelRad = (labelDeg * Math.PI) / 180;
          const labelRadius = R + 14;
          const lx = CX + labelRadius * Math.cos(labelRad);
          const ly = CY + labelRadius * Math.sin(labelRad);

          return (
            <g key={channel}>
              <line
                x1={CX}
                y1={CY}
                x2={bx}
                y2={by}
                stroke="#22d3ee"
                strokeOpacity={0.12}
                strokeWidth={1}
              />
              <text
                x={lx}
                y={ly}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={9}
                letterSpacing={1.5}
                fill="#22d3ee"
                fillOpacity={0.7}
                className="font-mono"
                fontFamily="monospace"
              >
                {channel}
              </text>
            </g>
          );
        })}

        {/* Sweep beam */}
        {sweep && (
          <path
            data-testid="radar-sweep"
            d={`M ${CX} ${CY} L ${CX} ${CY - R} A ${R} ${R} 0 0 1 ${
              CX + R * Math.sin((60 * Math.PI) / 180)
            } ${CY - R * Math.cos((60 * Math.PI) / 180)} Z`}
            fill="url(#sweep-gradient)"
            style={
              reducedMotion
                ? { transformOrigin: '200px 200px', transformBox: 'view-box' }
                : { transformOrigin: '200px 200px', transformBox: 'view-box' }
            }
            className={reducedMotion ? '' : 'animate-radar-sweep'}
          />
        )}

        {/* Sweep gradient definition */}
        <defs>
          <linearGradient id="sweep-gradient" x1="0" y1="0" x2="1" y2="1" gradientUnits="objectBoundingBox">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
          </linearGradient>
        </defs>

        {/* Blips */}
        {events.map((e, i) => {
          const sectorIdx = SIM_CHANNELS.indexOf(e.channel);
          const safeSectorIdx = sectorIdx >= 0 ? sectorIdx : 0;
          const dist = radarDistance(e.score);
          const angleOffset = blipAngleOffset(i);
          const { x, y } = polarToXY(safeSectorIdx, dist, angleOffset);
          const isActive = e.id === activeId;
          const color = LEVEL_COLORS[e.level] ?? '#94a3b8';
          const tone = socToneForLevel(e.level);
          const blipR = isActive ? 8 : 5;

          return (
            <g
              key={e.id}
              data-testid={`radar-blip-${e.id}`}
              data-level={e.level}
              data-distance={String(dist)}
              {...(isActive ? { 'data-active': 'true' } : {})}
              onClick={() => onSelect?.(e)}
              style={{ cursor: 'pointer' }}
            >
              {/* Expanding ring for HIGH risk */}
              {e.level === 'HIGH' && !reducedMotion && (
                <circle cx={x} cy={y} r={blipR} fill="none" stroke={color} strokeWidth={1.5} strokeOpacity={0.6}>
                  <animate
                    attributeName="r"
                    values={`${blipR};${blipR + 8};${blipR}`}
                    dur="1.5s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="stroke-opacity"
                    values="0.6;0;0.6"
                    dur="1.5s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}

              {/* Main blip circle */}
              <circle cx={x} cy={y} r={blipR} fill={color} fillOpacity={0.9} />

              {/* Active reticle */}
              {isActive && (
                <>
                  <circle cx={x} cy={y} r={blipR + 5} fill="none" stroke="#22d3ee" strokeWidth={1} strokeOpacity={0.8} />
                  <line x1={x - blipR - 7} y1={y} x2={x - blipR - 2} y2={y} stroke="#22d3ee" strokeWidth={1} />
                  <line x1={x + blipR + 2} y1={y} x2={x + blipR + 7} y2={y} stroke="#22d3ee" strokeWidth={1} />
                  <line x1={x} y1={y - blipR - 7} x2={x} y2={y - blipR - 2} stroke="#22d3ee" strokeWidth={1} />
                  <line x1={x} y1={y + blipR + 2} x2={x} y2={y + blipR + 7} stroke="#22d3ee" strokeWidth={1} />
                  <text
                    x={x + blipR + 8}
                    y={y - 2}
                    fontSize={9}
                    letterSpacing={1}
                    fill={SOC_TONES[tone].hex}
                    fontFamily="monospace"
                    className="font-mono"
                  >
                    {e.title.length > 18 ? e.title.slice(0, 18) + '…' : e.title}
                  </text>
                </>
              )}
            </g>
          );
        })}
      </svg>

      {/* Contact list */}
      {events.length === 0 && (
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-cyan-400/60 text-center py-2">
          NO CONTACTS
        </p>
      )}

      <ol aria-label="Radar contacts" className="flex flex-col gap-0.5">
        {events.map((e) => {
          const isActive = e.id === activeId;
          const tone = socToneForLevel(e.level);
          const color = SOC_TONES[tone];
          return (
            <li key={e.id}>
              <button
                type="button"
                aria-pressed={isActive}
                onClick={() => onSelect?.(e)}
                className={`w-full text-left px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] flex flex-wrap gap-x-2 gap-y-0.5 transition-colors
                  ${isActive
                    ? 'border-l-2 border-cyan-400 bg-cyan-400/5 text-cyan-300'
                    : 'border-l-2 border-transparent text-slate-400 hover:bg-slate-800/40'
                  }`}
              >
                <span className="text-slate-500">{e.time}</span>
                <span className="text-slate-400">{e.channel}</span>
                <span className="text-slate-300 flex-1 min-w-0 truncate">{e.title}</span>
                <span className={color.text}>RISK {e.score}</span>
                <span className={`${color.text} opacity-80`}>{STATUS_LABEL[e.status]}</span>
              </button>
            </li>
          );
        })}
      </ol>

      {/* SIMULATION tag */}
      <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-cyan-400/40 text-right px-1">
        SIMULATION
      </p>
    </div>
  );
}
