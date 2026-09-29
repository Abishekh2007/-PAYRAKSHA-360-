# Component and service contracts

Generated from the stubs at dispatch time. Other tasks are implementing these files right now: code against the
exported names, props and documented test hooks shown here (the real implementations keep them), not against how a
stub happens to render today.

## src/components/ui/index.ts

```ts
export * from './GlassCard';
export * from './Button';
export * from './Badge';
export * from './SimulationBadge';
export * from './SectionHeader';
export * from './RiskGauge';
export * from './ScanSteps';
export * from './ErrorNotice';
export * from './AnimatedNumber';
export * from './EngineBadge';
export * from './StatCard';
export * from './Toggle';
```

## src/components/ui/AnimatedNumber.tsx

```tsx
// STUB: replaced by the ui-kit task. Contract: the element has aria-label={format(value)} and data-value={value}
// from the first render; only the visible text counts up.
export interface AnimatedNumberProps { value: number; /** ms, default 900 */ duration?: number; format?: (n: number) => string; className?: string }

const defaultFormat = (n: number) => String(Math.round(n));

export function AnimatedNumber({ value, format = defaultFormat, className = '' }: AnimatedNumberProps) {
  return <span aria-label={format(value)} data-value={value} className={className}>{format(value)}</span>;
}
```

## src/components/ui/Badge.tsx

```tsx
// STUB: replaced by the ui-kit task. Keep the export name and props.
import type { ReactNode } from 'react';
import { TONE_CLASSES, type Tone } from '../../lib/risk';

export interface BadgeProps { tone?: Tone; icon?: ReactNode; className?: string; children: ReactNode }

export function Badge({ tone = 'neutral', icon, className = '', children }: BadgeProps) {
  return <span className={`chip ${TONE_CLASSES[tone]} ${className}`}>{icon}{children}</span>;
}
```

## src/components/ui/Button.tsx

```tsx
// STUB: replaced by the ui-kit task. Keep the export name and props.
import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'danger' | 'safe' | 'ghost' | 'outline';
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  /** Icon element shown before the label. */
  icon?: ReactNode;
  /** Shows a spinner, sets aria-busy and disables the button. */
  loading?: boolean;
  fullWidth?: boolean;
}

export function Button({ variant = 'primary', size = 'md', icon, loading = false, fullWidth = false, className = '', children, disabled, type = 'button', ...rest }: ButtonProps) {
  return (
    <button type={type} data-size={size} className={`btn-${variant} ${fullWidth ? 'w-full' : ''} ${className}`} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {icon}
      {children}
    </button>
  );
}
```

## src/components/ui/EngineBadge.tsx

```tsx
// STUB: replaced by the ui-kit task. Contract: data-source={source}; text says which engine answered:
// python-api -> "Python risk engine (FastAPI)", browser -> "In-browser engine (offline)", plus " · {ms} ms" when latencyMs is given.
import type { EngineSource } from '../../types';

export interface EngineBadgeProps { source: EngineSource; latencyMs?: number | null; className?: string }

export function EngineBadge({ source, latencyMs = null, className = '' }: EngineBadgeProps) {
  return (
    <span data-source={source} className={`chip ${className}`}>
      {source === 'python-api' ? 'Python risk engine (FastAPI)' : 'In-browser engine (offline)'}
      {latencyMs != null && ` · ${Math.round(latencyMs)} ms`}
    </span>
  );
}
```

## src/components/ui/ErrorNotice.tsx

```tsx
// STUB: replaced by the ui-kit task. Contract: role="alert" containing the exact message; a "Try again" button when onRetry is given.
export interface ErrorNoticeProps { message: string; onRetry?: () => void; className?: string }

export function ErrorNotice({ message, onRetry, className = '' }: ErrorNoticeProps) {
  return (
    <div role="alert" className={className}>
      <span>{message}</span>
      {onRetry && <button type="button" onClick={onRetry}>Try again</button>}
    </div>
  );
}
```

## src/components/ui/GlassCard.tsx

```tsx
// STUB: replaced by the ui-kit task. Keep the export name and props.
import type { HTMLAttributes } from 'react';
import type { RiskLevelId } from '../../types';

export interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  /** glass = translucent dark, strong = brighter glass, light = white card (dark text). Default glass. */
  variant?: 'glass' | 'strong' | 'light';
  /** Coloured glow for a risk level or the brand colour. Default none. */
  glow?: RiskLevelId | 'brand' | null;
  /** Default true (p-5 sm:p-6). */
  padded?: boolean;
}

export function GlassCard({ variant = 'glass', glow = null, padded = true, className = '', ...rest }: GlassCardProps) {
  const base = variant === 'strong' ? 'glass-strong' : variant === 'light' ? 'glass-light' : 'glass';
  return <div data-glow={glow ?? undefined} className={`${base} ${padded ? 'p-5' : ''} ${className}`} {...rest} />;
}
```

## src/components/ui/RiskGauge.tsx

```tsx
// STUB: replaced by the ui-kit task.
// Contract (tests rely on it): the root has role="meter", aria-valuenow={score} (the final score immediately,
// even while the visible number animates), aria-valuemin=0, aria-valuemax=100, aria-label="Risk score {score} out of 100".
import type { RiskLevelId } from '../../types';
import { levelTheme } from '../../lib/risk';

export interface RiskGaugeProps {
  score: number;
  level: RiskLevelId;
  /** Diameter in px. Default 200. */
  size?: number;
  /** Animate the arc and number from 0. Default true. */
  animate?: boolean;
  /** Show the level label (e.g. HIGH RISK) under the number. Default true. */
  showLabel?: boolean;
  className?: string;
}

export function RiskGauge({ score, level, size = 200, showLabel = true, className = '' }: RiskGaugeProps) {
  return (
    <div role="meter" aria-valuenow={score} aria-valuemin={0} aria-valuemax={100} aria-label={`Risk score ${score} out of 100`} data-level={level} style={{ width: size }} className={className}>
      <span>{score} / 100</span>
      {showLabel && <span> {levelTheme(level).short}</span>}
    </div>
  );
}
```

## src/components/ui/ScanSteps.tsx

```tsx
// STUB: replaced by the ui-kit task.
// Contract: an <ol>; each step is an <li data-state="done|active|pending"> containing the step text.
// Steps before activeIndex are done, the one at activeIndex is active, later ones pending.
// activeIndex -1 = nothing started; activeIndex >= steps.length = all done.
export interface ScanStepsProps { steps: string[]; activeIndex: number; className?: string }

export function ScanSteps({ steps, activeIndex, className = '' }: ScanStepsProps) {
  return (
    <ol className={className}>
      {steps.map((s, i) => (
        <li key={s} data-state={i < activeIndex ? 'done' : i === activeIndex ? 'active' : 'pending'}>{s}</li>
      ))}
    </ol>
  );
}
```

## src/components/ui/SectionHeader.tsx

```tsx
// STUB: replaced by the ui-kit task. Keep the export name and props. The title renders as an <h2>.
import type { ReactNode } from 'react';

export interface SectionHeaderProps { eyebrow?: string; title: ReactNode; subtitle?: ReactNode; icon?: ReactNode; align?: 'left' | 'center'; className?: string }

export function SectionHeader({ eyebrow, title, subtitle, icon, align = 'left', className = '' }: SectionHeaderProps) {
  return (
    <div className={`${align === 'center' ? 'text-center' : ''} ${className}`}>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2>{icon}{title}</h2>
      {subtitle && <p>{subtitle}</p>}
    </div>
  );
}
```

## src/components/ui/SimulationBadge.tsx

```tsx
// STUB: replaced by the ui-kit task. Contract: always renders the exact text "SIMULATION / DEMO".
import { TONE_CLASSES } from '../../lib/risk';

export interface SimulationBadgeProps { compact?: boolean; className?: string }

export function SimulationBadge({ compact = false, className = '' }: SimulationBadgeProps) {
  return <span data-testid="simulation-badge" data-compact={compact} className={`chip ${TONE_CLASSES.demo} ${className}`}>SIMULATION / DEMO</span>;
}
```

## src/components/ui/StatCard.tsx

```tsx
// STUB: replaced by the ui-kit task. Keep the export name and props.
import type { ReactNode } from 'react';
import type { Tone } from '../../lib/risk';

export interface StatCardProps { label: string; value: ReactNode; hint?: ReactNode; icon?: ReactNode; tone?: Tone; className?: string }

export function StatCard({ label, value, hint, icon, tone = 'neutral', className = '' }: StatCardProps) {
  return (
    <div data-tone={tone} className={`glass p-4 ${className}`}>
      {icon}
      <p>{label}</p>
      <p>{value}</p>
      {hint && <p>{hint}</p>}
    </div>
  );
}
```

## src/components/ui/Toggle.tsx

```tsx
// STUB: replaced by the ui-kit task. Contract: a <button role="switch" aria-checked={checked} aria-label={label}>; click calls onChange(!checked).
export interface ToggleProps { checked: boolean; onChange: (next: boolean) => void; label: string; description?: string; disabled?: boolean; className?: string }

export function Toggle({ checked, onChange, label, description, disabled = false, className = '' }: ToggleProps) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} disabled={disabled} onClick={() => onChange(!checked)} className={className}>
      <span>{label}</span>
      {description && <span>{description}</span>}
    </button>
  );
}
```

## src/components/risk/index.ts

```ts
export * from './RiskScoreCard';
export * from './PaymentPreview';
export * from './ExplanationPanel';
export * from './RecommendationPanel';
export * from './ScamDnaChart';
export * from './AttackChainView';
export * from './ContributionsChart';
export * from './SignalList';
export * from './UrlChecksList';
export * from './MlInsightCard';
export * from './RiskResultView';
```

## src/components/risk/AttackChainView.tsx

```tsx
// STUB: replaced by the risk-viz task. Contract: root data-testid="attack-chain"; one item per node with data-active and the node label.
import type { AttackChainNode } from '../../types';

export interface AttackChainViewProps {
  nodes: AttackChainNode[];
  /** Reveal nodes one by one. Default true. */
  animate?: boolean;
  /** Default: vertical on mobile, horizontal from md. */
  orientation?: 'horizontal' | 'vertical' | 'responsive';
  className?: string;
}

export function AttackChainView({ nodes, orientation = 'responsive', className = '' }: AttackChainViewProps) {
  return (
    <ol data-testid="attack-chain" data-orientation={orientation} className={className}>
      {nodes.map((n) => <li key={n.id} data-active={n.active}>{n.icon} {n.label}</li>)}
    </ol>
  );
}
```

## src/components/risk/ContributionsChart.tsx

```tsx
// STUB: replaced by the risk-viz task. Contract: root data-testid="contributions"; one row per contribution with points > 0
// (label and "+{points}"), and a total row showing the score.
import type { Contribution } from '../../types';

export interface ContributionsChartProps { contributions: Contribution[]; score: number; clamped?: boolean; className?: string }

export function ContributionsChart({ contributions, score, className = '' }: ContributionsChartProps) {
  return (
    <ul data-testid="contributions" className={className}>
      {contributions.filter((c) => c.points > 0).map((c) => <li key={c.key}>{c.label} +{c.points}</li>)}
      <li>Total {score}</li>
    </ul>
  );
}
```

## src/components/risk/ExplanationPanel.tsx

```tsx
// STUB: replaced by the risk-core task.
// Contract: heading = title ?? ("WHY THIS LOOKS SAFER" for LOW, else "WHY ARE WE WARNING YOU?"); lists
// explanation.reasons, explanation.trustSignals (each prefixed "✓") and the disclaimer.
import type { RiskReport } from '../../types';

export interface ExplanationPanelProps { report: RiskReport; title?: string; className?: string }

export function ExplanationPanel({ report, title, className = '' }: ExplanationPanelProps) {
  const heading = title ?? (report.level === 'LOW' ? 'WHY THIS LOOKS SAFER' : 'WHY ARE WE WARNING YOU?');
  const ex = report.explanation;
  return (
    <div className={className}>
      <h3>{heading}</h3>
      <p>{ex.summary}</p>
      <ul>{ex.reasons.map((r) => <li key={r}>{r}</li>)}</ul>
      {ex.trustSignals.length > 0 && <ul>{ex.trustSignals.map((t) => <li key={t}>✓ {t}</li>)}</ul>}
      <p>{ex.disclaimer}</p>
    </div>
  );
}
```

## src/components/risk/MlInsightCard.tsx

```tsx
// STUB: replaced by the risk-core task. Renders nothing when ml is null or unavailable.
import type { MlInsight } from '../../types';

export interface MlInsightCardProps { ml: MlInsight | null | undefined; className?: string }

export function MlInsightCard({ ml, className = '' }: MlInsightCardProps) {
  if (!ml || !ml.available) return null;
  return <div data-testid="ml-insight" className={className}>{ml.label} {Math.round(ml.scamProbability * 100)}%</div>;
}
```

## src/components/risk/PaymentPreview.tsx

```tsx
// STUB: replaced by the risk-core task. Shows recipient, amount (fmtINR), merchant and source, with a SimulationBadge.
import type { PaymentContext } from '../../types';
import { fmtINR } from '../../engine';

export interface PaymentPreviewProps { payment: PaymentContext; /** Default 'PAYMENT PREVIEW'. */ title?: string; className?: string }

export function PaymentPreview({ payment, title = 'PAYMENT PREVIEW', className = '' }: PaymentPreviewProps) {
  return (
    <div className={className}>
      <h3>{title}</h3>
      <dl>
        <dt>Recipient</dt><dd>{payment.recipient ?? 'Not identified'}</dd>
        <dt>Amount</dt><dd>{payment.amount != null ? fmtINR(payment.amount) : 'Not specified'}</dd>
        <dt>Merchant</dt><dd>{payment.merchant ?? 'Not identified'}</dd>
        <dt>Source</dt><dd>{payment.sourceLabel}</dd>
      </dl>
    </div>
  );
}
```

## src/components/risk/RecommendationPanel.tsx

```tsx
// STUB: replaced by the risk-core task.
// Contract: shows recommendation.title (e.g. "DON'T PAY YET") and message, and one <button> per action whose
// accessible name is exactly the action label (e.g. "VERIFY OFFICIALLY"); clicking calls onAction(action.id).
import type { ActionId, Recommendation, RiskLevelId } from '../../types';

export interface RecommendationPanelProps { recommendation: Recommendation; level: RiskLevelId; onAction?: (id: ActionId) => void; className?: string }

export function RecommendationPanel({ recommendation, level, onAction, className = '' }: RecommendationPanelProps) {
  return (
    <div data-level={level} className={className}>
      <h3>{recommendation.title}</h3>
      <p>{recommendation.message}</p>
      <div>
        {recommendation.actions.map((a) => (
          <button key={a.id} type="button" onClick={() => onAction?.(a.id)}>{a.label}</button>
        ))}
      </div>
    </div>
  );
}
```

## src/components/risk/RiskResultView.tsx

```tsx
// STUB: replaced by the risk-core task.
// Contract: root data-testid="risk-result" data-score data-level. Composes PaymentPreview (when showPayment),
// RiskScoreCard, ExplanationPanel, RecommendationPanel, EngineBadge (when source is given) and MlInsightCard.
// Must be rendered inside a Router. Default action handling when onAction is not given:
// 'analysis' -> navigate('/explain'), 'trusted' -> navigate('/trusted'); 'verify', 'cancel' and 'continue' show an inline demo note.
import type { ActionId, EngineSource, MlInsight, RiskReport } from '../../types';
import { EngineBadge } from '../ui/EngineBadge';
import { ExplanationPanel } from './ExplanationPanel';
import { MlInsightCard } from './MlInsightCard';
import { PaymentPreview } from './PaymentPreview';
import { RecommendationPanel } from './RecommendationPanel';
import { RiskScoreCard } from './RiskScoreCard';

export interface RiskResultViewProps {
  report: RiskReport;
  source?: EngineSource;
  latencyMs?: number | null;
  ml?: MlInsight | null;
  /** Default true. */
  showPayment?: boolean;
  onAction?: (id: ActionId) => void;
  className?: string;
}

export function RiskResultView({ report, source, latencyMs = null, ml = null, showPayment = true, onAction, className = '' }: RiskResultViewProps) {
  return (
    <div data-testid="risk-result" data-score={report.score} data-level={report.level} className={className}>
      {showPayment && <PaymentPreview payment={report.payment} />}
      <RiskScoreCard report={report} />
      <ExplanationPanel report={report} />
      <RecommendationPanel recommendation={report.recommendation} level={report.level} onAction={onAction} />
      {source && <EngineBadge source={source} latencyMs={latencyMs} />}
      <MlInsightCard ml={ml} />
    </div>
  );
}
```

## src/components/risk/RiskScoreCard.tsx

```tsx
// STUB: replaced by the risk-core task.
// Contract: root has data-testid="risk-score-card", data-score, data-level; shows riskHeadline(level)
// (e.g. "🚨 HIGH RISK PAYMENT"), a RiskGauge and the text "{score} / 100".
import type { RiskReport } from '../../types';
import { riskHeadline } from '../../lib/risk';
import { RiskGauge } from '../ui/RiskGauge';

export interface RiskScoreCardProps { report: RiskReport; compact?: boolean; className?: string }

export function RiskScoreCard({ report, compact = false, className = '' }: RiskScoreCardProps) {
  return (
    <div data-testid="risk-score-card" data-score={report.score} data-level={report.level} data-compact={compact} className={className}>
      <p>{riskHeadline(report.level)}</p>
      <RiskGauge score={report.score} level={report.level} />
    </div>
  );
}
```

## src/components/risk/ScamDnaChart.tsx

```tsx
// STUB: replaced by the risk-viz task. Contract: root data-testid="scam-dna"; each strand shows its label and "{percent}%".
import type { DnaStrand } from '../../types';

export interface ScamDnaChartProps { dna: DnaStrand[]; /** Default 'bars'. */ variant?: 'bars' | 'radar'; className?: string }

export function ScamDnaChart({ dna, variant = 'bars', className = '' }: ScamDnaChartProps) {
  return (
    <ul data-testid="scam-dna" data-variant={variant} className={className}>
      {dna.map((d) => <li key={d.key}>{d.label} {d.percent}%</li>)}
    </ul>
  );
}
```

## src/components/risk/SignalList.tsx

```tsx
// STUB: replaced by the risk-viz task. Lists text signals (label, matched cues, severity).
import type { TextSignal } from '../../types';

export interface SignalListProps { signals: TextSignal[]; className?: string }

export function SignalList({ signals, className = '' }: SignalListProps) {
  return <ul className={className}>{signals.map((s) => <li key={s.id} data-severity={s.severity}>{s.label}: {s.cues.join(', ')}</li>)}</ul>;
}
```

## src/components/risk/UrlChecksList.tsx

```tsx
// STUB: replaced by the risk-viz task. Shows host (as text, never a link), reputation and each check with its points.
import type { UrlAnalysis } from '../../types';

export interface UrlChecksListProps { analysis: UrlAnalysis; className?: string }

export function UrlChecksList({ analysis, className = '' }: UrlChecksListProps) {
  return (
    <div className={className}>
      <p>{analysis.host}</p>
      <ul>{analysis.checks.map((c) => <li key={c.id}>{c.label} +{c.points}</li>)}</ul>
    </div>
  );
}
```

## src/components/layout/index.ts

```ts
export * from './AppLayout';
export * from './DemoBanner';
export * from './Navbar';
export * from './Footer';
export * from './PageShell';
```

## src/components/layout/PageShell.tsx

```tsx
// STUB: replaced by the layout task. Contract: the title renders as the page's <h1>; eyebrow, subtitle and actions render when given.
import type { ReactNode } from 'react';

export interface PageShellProps {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  icon?: ReactNode;
  /** Right-aligned header content (buttons, badges). */
  actions?: ReactNode;
  /** narrow = max-w-3xl, default = max-w-6xl, wide = max-w-7xl. */
  width?: 'narrow' | 'default' | 'wide';
  className?: string;
  children: ReactNode;
}

export function PageShell({ eyebrow, title, subtitle, icon, actions, width = 'default', className = '', children }: PageShellProps) {
  return (
    <section data-width={width} className={className}>
      <header>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{icon}{title}</h1>
        {subtitle && <p>{subtitle}</p>}
        {actions}
      </header>
      {children}
    </section>
  );
}
```

## src/components/three/index.tsx

```tsx
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
```

## src/services/api.ts

```ts
// STUB: the services task adds the FastAPI call (POST /api/analyze, short timeout) in front of this local fallback.
// Contract: never throws for backend problems; it falls back to the in-browser engine and says so in `source`.
import type { AnalyzeInput, AnalyzeResponse, BackendHealth, UrlResponse } from '../types';
import { analyzeLocal, analyzeUrlLocal } from '../engine';

export interface ApiOptions {
  /** Backend timeout in ms before falling back. Default 1500. */
  timeoutMs?: number;
  /** Skip the backend and use the in-browser engine. */
  preferLocal?: boolean;
  signal?: AbortSignal;
}

const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

/** Analyses a payment situation: Python API first, in-browser engine as fallback. */
export async function analyzeRisk(input: AnalyzeInput, _opts: ApiOptions = {}): Promise<AnalyzeResponse> {
  const t0 = now();
  const report = analyzeLocal(input);
  return { report, source: 'browser', latencyMs: now() - t0, ml: null };
}

/** URL-only analysis (simulated intelligence; the URL is never fetched). */
export async function analyzeUrlRisk(url: string, _opts: ApiOptions = {}): Promise<UrlResponse> {
  const t0 = now();
  return { analysis: analyzeUrlLocal(url), source: 'browser', latencyMs: now() - t0 };
}

/** GET /api/health, or null when the backend is not reachable. */
export async function getBackendHealth(_opts: ApiOptions = {}): Promise<BackendHealth | null> {
  return null;
}
```

## src/services/qr.ts

```ts
// STUB: the services task implements decoding (jsqr), camera scanning and full payload building.
import QRCode from 'qrcode';

export const QR_READ_ERROR = 'Unable to read QR. Try again or upload a clearer image.';
export const CAMERA_ERROR = 'Camera unavailable. Use Demo QR or Upload QR.';

export class QrReadError extends Error {
  constructor(message = QR_READ_ERROR) { super(message); this.name = 'QrReadError'; }
}
export class CameraUnavailableError extends Error {
  constructor(message = CAMERA_ERROR) { super(message); this.name = 'CameraUnavailableError'; }
}

/** Fields of a PAYRAKSHA demo QR. Recipients must be fake demo ids ending in "@demo". */
export interface DemoQrFields {
  recipient: string;
  amount: number;
  merchant: string;
  note?: string;
  /** Free text such as "WhatsApp Demo" (the engine normalises it). */
  source?: string;
  scenario?: string;
  urgency?: boolean;
  recipientVerified?: boolean;
}

/** Builds a demo payload ("PAYRAKSHA://demo-payment" + key=value lines). Never a real UPI link. */
export function buildDemoQrPayload(f: DemoQrFields): string {
  const lines = ['PAYRAKSHA://demo-payment', `recipient=${f.recipient}`, `amount=${f.amount}`, `merchant=${f.merchant}`];
  if (f.note) lines.push(`note=${f.note}`);
  if (f.source) lines.push(`source=${f.source}`);
  if (f.urgency !== undefined) lines.push(`urgency=${f.urgency}`);
  if (f.recipientVerified !== undefined) lines.push(`recipientVerified=${f.recipientVerified}`);
  if (f.scenario) lines.push(`scenario=${f.scenario}`);
  return lines.join('\n');
}

/** Decodes a QR from raw pixels; null when none is found. */
export function decodeQrFromImageData(_data: ImageData): string | null {
  return null;
}

/** Decodes a QR from an uploaded image. Rejects with QrReadError when unreadable. */
export async function decodeQrFromFile(_file: File): Promise<string> {
  throw new QrReadError();
}

/** Starts the rear camera on `video` and calls onResult once with the decoded text. Rejects with CameraUnavailableError. */
export async function startCameraScan(_video: HTMLVideoElement, _onResult: (text: string) => void): Promise<{ stop: () => void }> {
  throw new CameraUnavailableError();
}

/** Renders text as an SVG QR code string. */
export async function generateQrSvg(text: string): Promise<string> {
  return QRCode.toString(text, { type: 'svg', margin: 1, errorCorrectionLevel: 'M' });
}

export function svgToDataUrl(svg: string): string {
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}
```

## src/services/report.ts

```ts
// STUB: the services task finishes this. Incident reports are DEMO documents, never official cybercrime reports.
import type { IncidentReportDoc, RiskReport } from '../types';
import { fmtINR } from '../engine';

export const DEMO_REPORT_TITLE = 'DEMO REPORT — NOT AN OFFICIAL CYBERCRIME REPORT';

export function buildIncidentReport(report: RiskReport, opts: { generatedAt?: Date | string } = {}): IncidentReportDoc {
  const at = opts.generatedAt ?? new Date();
  const p = report.payment;
  return {
    title: DEMO_REPORT_TITLE,
    reportId: report.id,
    generatedAt: typeof at === 'string' ? at : at.toISOString(),
    score: report.score,
    level: report.level,
    levelLabel: report.levelLabel,
    patternName: report.patternName,
    payment: {
      recipient: p.recipient ?? 'Not identified',
      amount: p.amount != null ? fmtINR(p.amount) : 'Not identified',
      merchant: p.merchant ?? 'Not identified',
      source: p.sourceLabel,
    },
    signals: report.explanation.reasons,
    dna: report.dna.map((d) => ({ label: d.label, percent: d.percent })),
    attackChain: report.attackChain.filter((n) => n.active).map((n) => `${n.label}: ${n.detail}`),
    recommendation: report.recommendation.title,
    safeActions: ['Do not pay until the recipient is verified through an official channel.'],
    disclaimer: report.explanation.disclaimer,
    notice: report.notice,
  };
}

export function incidentReportToText(doc: IncidentReportDoc): string {
  return [doc.title, `Report ID: ${doc.reportId}`, `Risk: ${doc.score} / 100 (${doc.levelLabel})`].join('\n');
}

export function downloadIncidentReport(doc: IncidentReportDoc, format: 'txt' | 'json' = 'txt'): void {
  const body = format === 'json' ? JSON.stringify(doc, null, 2) : incidentReportToText(doc);
  const url = URL.createObjectURL(new Blob([body], { type: format === 'json' ? 'application/json' : 'text/plain' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `payraksha-demo-report-${doc.reportId}.${format}`;
  a.click();
  URL.revokeObjectURL(url);
}
```

## src/test/utils.tsx

```tsx
import type { ReactElement } from 'react';
import { render, type RenderResult } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

/** Renders a page or component inside a router (pages use Link / useNavigate). */
export function renderWithRouter(ui: ReactElement, { route = '/' }: { route?: string } = {}): RenderResult {
  return render(<MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>);
}
```
