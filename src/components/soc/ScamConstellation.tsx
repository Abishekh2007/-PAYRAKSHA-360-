import { useReducedMotion } from 'framer-motion';
import type { RiskReport, Severity } from '../../types';
import { engineConfig } from '../../engine';
import { socToneForLevel } from './tones';

export interface ConstellationStar {
  /** `dna-${strand.key}` or `sig-${signal.id}`. */
  id: string;
  label: string;
  kind: 'dna' | 'signal';
  severity: Severity;
}

export interface PatternHypothesis {
  /** Category id, e.g. 'utility'. */
  category: string;
  /** Category label, e.g. 'Utility / Electricity'. */
  label: string;
  /** Simulated confidence, integer 0..99 (never 100). */
  percent: number;
}

/**
 * Build stars and hypotheses from a RiskReport.
 */
export function constellationFor(
  report: RiskReport | null | undefined,
): { stars: ConstellationStar[]; hypotheses: PatternHypothesis[] } {
  if (!report) return { stars: [], hypotheses: [] };

  // Stars: dna strands with severity !== 'none', then signals with severity !== 'none'
  const stars: ConstellationStar[] = [
    ...report.dna
      .filter((s) => s.severity !== 'none')
      .map((s) => ({
        id: `dna-${s.key}`,
        label: s.label,
        kind: 'dna' as const,
        severity: s.severity,
      })),
    ...report.analyses.text.signals
      .filter((s) => s.severity !== 'none')
      .map((s) => ({
        id: `sig-${s.id}`,
        label: s.label,
        kind: 'signal' as const,
        severity: s.severity,
      })),
  ];

  // Hypotheses: positive categoryScores entries (value > 0)
  const categoryScores = report.analyses.text.categoryScores ?? {};
  const positive = Object.entries(categoryScores).filter(([, v]) => v > 0);
  const total = positive.reduce((sum, [, v]) => sum + v, 0);
  const ownCategory = report.analyses.text.category;

  // Sort: own category first, then others by value descending, ties by id ascending
  positive.sort(([idA, vA], [idB, vB]) => {
    const aIsOwn = idA === ownCategory;
    const bIsOwn = idB === ownCategory;
    if (aIsOwn && !bIsOwn) return -1;
    if (!aIsOwn && bIsOwn) return 1;
    if (vB !== vA) return vB - vA;
    return idA.localeCompare(idB);
  });

  const hypotheses: PatternHypothesis[] = positive.slice(0, 3).map(([id, value]) => {
    const label =
      id === ownCategory
        ? report.analyses.text.categoryLabel
        : (engineConfig.engine.categories as Record<string, { label?: string }>)[id]?.label ?? id;
    const percent = Math.round((100 * value) / (total + 1));
    return { category: id, label, percent };
  });

  return { stars, hypotheses };
}

export interface ScamConstellationProps {
  report: RiskReport | null;
  className?: string;
}

// Constants for SVG layout
const SVG_W = 480;
const SVG_H = 320;
const CX = SVG_W / 2;
const CY = SVG_H / 2;
const INNER_RX = 80;
const INNER_RY = 65;
const OUTER_RX = 170;
const OUTER_RY = 130;

const SEVERITY_RADIUS: Record<Severity, number> = {
  none: 0,
  low: 4,
  medium: 5.5,
  high: 7,
};

const SEVERITY_COLOR: Record<Severity, string> = {
  none: '#22d3ee',
  low: '#22d3ee',
  medium: '#f59e0b',
  high: '#ef4444',
};

function starPos(
  index: number,
  total: number,
  rx: number,
  ry: number,
): { x: number; y: number } {
  const angle = ((-90 + (360 * index) / total) * Math.PI) / 180;
  return {
    x: CX + rx * Math.cos(angle),
    y: CY + ry * Math.sin(angle),
  };
}

function truncate(text: string, max = 22): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1) + '…';
}

function centralNodeColor(level: string | undefined): string {
  switch (level) {
    case 'HIGH':
    case 'HIGH_CAUTION':
      return '#ef4444';
    case 'CAUTION':
      return '#f59e0b';
    case 'LOW':
      return '#22c55e';
    default:
      return '#22d3ee';
  }
}

function StarNode({
  star,
  pos,
  dashFlow,
}: {
  star: ConstellationStar;
  pos: { x: number; y: number };
  dashFlow: boolean;
}) {
  const r = SEVERITY_RADIUS[star.severity];
  const color = SEVERITY_COLOR[star.severity];
  const labelX = pos.x;
  const labelY = pos.y + r + 11;

  return (
    <g data-testid={`star-${star.id}`} data-severity={star.severity}>
      <line
        x1={CX}
        y1={CY}
        x2={pos.x}
        y2={pos.y}
        stroke={color}
        strokeWidth={0.8}
        strokeOpacity={0.5}
        strokeDasharray="4 4"
        className={dashFlow ? 'animate-dash-flow' : undefined}
      />
      <circle cx={pos.x} cy={pos.y} r={r} fill={color} fillOpacity={0.85} />
      <text
        x={labelX}
        y={labelY}
        textAnchor="middle"
        fontSize={9}
        letterSpacing={1}
        fill="#94a3b8"
        className="font-mono"
        fontFamily="monospace"
      >
        {truncate(star.label)}
      </text>
    </g>
  );
}

export function ScamConstellation({ report, className = '' }: ScamConstellationProps) {
  const reducedMotion = useReducedMotion();
  const dashFlow = !reducedMotion;

  const { stars, hypotheses } = constellationFor(report);

  const dnaStars = stars.filter((s) => s.kind === 'dna');
  const sigStars = stars.filter((s) => s.kind === 'signal');

  const centralColor = centralNodeColor(report?.level);
  const tone = socToneForLevel(report?.level ?? null);
  void tone;

  const patternName = report?.patternName ?? '';
  const isLong = patternName.length > 18;
  const nameFontSize = isLong ? 8 : 10;

  return (
    <div data-testid="scam-constellation" className={`flex flex-col gap-4 ${className}`}>
      {/* SVG Constellation */}
      <svg
        role="img"
        aria-label="Scam constellation (simulation)"
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        width="100%"
        style={{ display: 'block' }}
      >
        {/* Grid lines */}
        <line x1={0} y1={CY} x2={SVG_W} y2={CY} stroke="#22d3ee" strokeWidth={0.3} strokeOpacity={0.1} />
        <line x1={CX} y1={0} x2={CX} y2={SVG_H} stroke="#22d3ee" strokeWidth={0.3} strokeOpacity={0.1} />

        {/* DNA stars on inner ellipse */}
        {dnaStars.map((star, i) => {
          const pos = starPos(i, Math.max(dnaStars.length, 1), INNER_RX, INNER_RY);
          return <StarNode key={star.id} star={star} pos={pos} dashFlow={dashFlow} />;
        })}

        {/* Signal stars on outer ellipse */}
        {sigStars.map((star, i) => {
          const pos = starPos(i, Math.max(sigStars.length, 1), OUTER_RX, OUTER_RY);
          return <StarNode key={star.id} star={star} pos={pos} dashFlow={dashFlow} />;
        })}

        {/* Central node */}
        <circle
          cx={CX}
          cy={CY}
          r={24}
          fill={centralColor}
          fillOpacity={0.15}
          stroke={centralColor}
          strokeWidth={1.5}
        />
        <circle cx={CX} cy={CY} r={6} fill={centralColor} fillOpacity={0.9} />
        {/* Pattern name below central node */}
        <text
          x={CX}
          y={CY + 38}
          textAnchor="middle"
          fontSize={nameFontSize}
          letterSpacing={1.5}
          fill="#e2e8f0"
          className="font-mono"
          fontFamily="monospace"
        >
          {patternName}
        </text>

        {/* Empty state inside SVG */}
        {stars.length === 0 && (
          <text
            x={CX}
            y={CY - 40}
            textAnchor="middle"
            fontSize={10}
            letterSpacing={1.5}
            fill="#64748b"
            className="font-mono"
            fontFamily="monospace"
          >
            NO SIGNALS
          </text>
        )}
      </svg>

      {/* Empty state text */}
      {stars.length === 0 && (
        <p className="hud-label text-center text-slate-500">NO WARNING SIGNALS CONNECTED</p>
      )}

      {/* Pattern Hypotheses */}
      <div className="flex flex-col gap-2">
        <p className="hud-eyebrow">PATTERN HYPOTHESES</p>
        {hypotheses.length === 0 ? (
          <p className="hud-label text-slate-500">NO PATTERN HYPOTHESIS</p>
        ) : (
          <ul aria-label="Pattern hypotheses" className="flex flex-col gap-2">
            {hypotheses.map((h, i) => (
              <li key={h.category} data-testid={`hypothesis-${i}`} className="flex flex-col gap-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="hud-label text-slate-300">{h.label}</span>
                  <span className="hud-num text-violet-300">{h.percent}%</span>
                </div>
                {/* Plain div bar — NOT role=meter, NOT role=progressbar */}
                <div className="h-1 w-full rounded-sm bg-slate-700/60">
                  <div
                    className="h-1 rounded-sm bg-violet-400/70"
                    style={{ width: `${h.percent}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="hud-eyebrow mt-1 text-slate-500">SIMULATED CONFIDENCE</p>
      </div>

      {/* Simulation tag */}
      <p className="hud-eyebrow text-slate-600">SIMULATION</p>
    </div>
  );
}
