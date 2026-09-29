// Risk level and severity -> visual theme. Tailwind classes are literal so the JIT keeps them.
import type { RiskLevelId, Severity } from '../types';

export type Tone = 'low' | 'caution' | 'high_caution' | 'high' | 'info' | 'neutral' | 'demo';

export interface LevelTheme {
  id: RiskLevelId;
  hex: string;
  text: string;
  bg: string;
  border: string;
  glow: string;
  emoji: string;
  /** e.g. 'HIGH RISK PAYMENT'. */
  headline: string;
  /** e.g. 'HIGH RISK'. */
  short: string;
  tone: Tone;
}

export const LEVEL_THEME: Record<RiskLevelId, LevelTheme> = {
  LOW: { id: 'LOW', hex: '#22c55e', text: 'text-risk-low', bg: 'bg-risk-low/15', border: 'border-risk-low/40', glow: 'shadow-glow-low', emoji: '✅', headline: 'LOW RISK PAYMENT', short: 'LOW RISK', tone: 'low' },
  CAUTION: { id: 'CAUTION', hex: '#f59e0b', text: 'text-risk-caution', bg: 'bg-risk-caution/15', border: 'border-risk-caution/40', glow: 'shadow-glow-caution', emoji: '⚠️', headline: 'CAUTION: CHECK BEFORE YOU PAY', short: 'CAUTION', tone: 'caution' },
  HIGH_CAUTION: { id: 'HIGH_CAUTION', hex: '#f97316', text: 'text-risk-elevated', bg: 'bg-risk-elevated/15', border: 'border-risk-elevated/40', glow: 'shadow-glow-elevated', emoji: '⚠️', headline: 'HIGH CAUTION PAYMENT', short: 'HIGH CAUTION', tone: 'high_caution' },
  HIGH: { id: 'HIGH', hex: '#ef4444', text: 'text-risk-high', bg: 'bg-risk-high/15', border: 'border-risk-high/40', glow: 'shadow-glow-high', emoji: '🚨', headline: 'HIGH RISK PAYMENT', short: 'HIGH RISK', tone: 'high' },
};

export function levelTheme(level: RiskLevelId | string | null | undefined): LevelTheme {
  return LEVEL_THEME[level as RiskLevelId] ?? LEVEL_THEME.LOW;
}

/** "🚨 HIGH RISK PAYMENT" */
export function riskHeadline(level: RiskLevelId | string): string {
  const t = levelTheme(level);
  return `${t.emoji} ${t.headline}`;
}

export const toneForLevel = (level: RiskLevelId | string): Tone => levelTheme(level).tone;

export interface SeverityTheme { text: string; bg: string; border: string; hex: string; label: string }
export const SEVERITY_THEME: Record<Severity, SeverityTheme> = {
  none: { text: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/30', hex: '#64748b', label: 'None' },
  low: { text: 'text-risk-low', bg: 'bg-risk-low/15', border: 'border-risk-low/40', hex: '#22c55e', label: 'Low' },
  medium: { text: 'text-risk-caution', bg: 'bg-risk-caution/15', border: 'border-risk-caution/40', hex: '#f59e0b', label: 'Medium' },
  high: { text: 'text-risk-high', bg: 'bg-risk-high/15', border: 'border-risk-high/40', hex: '#ef4444', label: 'High' },
};

export function severityTheme(s: Severity | string): SeverityTheme {
  return SEVERITY_THEME[s as Severity] ?? SEVERITY_THEME.none;
}

export const TONE_CLASSES: Record<Tone, string> = {
  low: 'border-risk-low/40 bg-risk-low/15 text-risk-low',
  caution: 'border-risk-caution/40 bg-risk-caution/15 text-risk-caution',
  high_caution: 'border-risk-elevated/40 bg-risk-elevated/15 text-risk-elevated',
  high: 'border-risk-high/40 bg-risk-high/15 text-risk-high',
  info: 'border-brand-400/40 bg-brand-400/10 text-brand-300',
  neutral: 'border-white/15 bg-white/5 text-slate-300',
  demo: 'border-amber-300/50 bg-amber-300/10 text-amber-200',
};
