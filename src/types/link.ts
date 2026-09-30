// Phone ↔ console link contract (shared by the console in src/ and RakshaPay in pay/).
// SIMULATION ONLY: a LinkEvent records a demo risk check made on a phone. No payment is ever made, forwarded or authorized.
import type { AnalyzeInput, RiskLevelId, RiskReport } from '../../shared/reference/engine.mjs';
import type { MlInsight } from './index';

/** Where the phone got the payment it checked. */
export type LinkSource = 'camera' | 'gallery' | 'console-target' | 'sample' | 'manual';
export const LINK_SOURCES: readonly LinkSource[] = ['camera', 'gallery', 'console-target', 'sample', 'manual'];

/** What the user chose on the phone. 'paid_demo' is a SIMULATED payment: no money moves. */
export type LinkDecision = 'pending' | 'cancelled' | 'verify' | 'trusted' | 'paid_demo';
export const LINK_DECISIONS: readonly LinkDecision[] = ['pending', 'cancelled', 'verify', 'trusted', 'paid_demo'];

/** One risk check made on a linked phone. */
export interface LinkEvent {
  /** 'lk_' + 8 hex chars; stays the same when the phone re-checks with more context. */
  id: string;
  /** Monotonic sequence number; bumped on every change (new scan, re-check, decision). */
  seq: number;
  /** ISO timestamp of the latest change. */
  at: string;
  /** Phone's display name, 1–40 chars, e.g. 'Pixel 8'. */
  device: string;
  source: LinkSource;
  input: AnalyzeInput;
  score: number;
  level: RiskLevelId;
  levelLabel: string;
  patternName: string;
  /** Payee handle from the report (report.payment.recipient), e.g. 'unknown-electricity@demo'. */
  recipient: string | null;
  amount: number | null;
  /** report.explanation.headline, e.g. 'Multiple warning signals detected'. */
  headline: string;
  decision: LinkDecision;
  decidedAt: string | null;
  simulation: true;
}

/** The demo QR the console is presenting for the phone to scan ("Scan what the console shows"). */
export interface LinkTarget { qrText: string; label: string; setAt: string }

export interface LinkDevice { name: string; lastSeen: string; online: boolean }

/** GET /api/link/events?after=<seq> */
export interface LinkEventsResponse {
  /** Events with seq > after, oldest first, at most 50. */
  events: LinkEvent[];
  latestSeq: number;
  devices: LinkDevice[];
  target: LinkTarget | null;
  simulation: true;
}

/** POST /api/link/scan */
export interface LinkScanRequest { device: string; source: LinkSource; input: AnalyzeInput; replaces?: string }
export interface LinkScanResponse { event: LinkEvent; report: RiskReport; ml: MlInsight | null }

/** POST /api/link/decision */
export interface LinkDecisionRequest { id: string; decision: Exclude<LinkDecision, 'pending'> }

/** GET /api/link/info */
export interface LinkInfo {
  consoleUrl: string | null;
  /** RakshaPay's local URL, e.g. 'http://127.0.0.1:7481'. */
  payUrl: string | null;
  /** 'https://<machine>.<tailnet>.ts.net' when the launcher detected Tailscale, else null. */
  phoneUrl: string | null;
  /** True when RakshaPay listens on all interfaces (--lan). */
  lan: boolean;
  simulation: true;
}
