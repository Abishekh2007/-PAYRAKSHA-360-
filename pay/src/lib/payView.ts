// Turns a RiskReport into what the RakshaPay pay screen shows. SIMULATION ONLY: nothing here pays anything.
// STUB: paymentView and withContext are implemented by the pay-check task (the contract below is final).
// formatInr, isDemoVpa and maskVpa are final.
import type { AnalyzeInput, RiskLevelId, RiskReport } from '../../../src/types';
import { fmtINR } from '../../../src/engine';

/**
 * demo-pay: payee is a fake `@demo` handle, the demo "pay" flow is allowed (it never moves money).
 * analysis-only: a real-looking UPI ID (not @demo): show the check, mask the ID, NO pay button.
 * not-payment: the QR has no payee at all (a URL or plain text).
 */
export type PayMode = 'demo-pay' | 'analysis-only' | 'not-payment';
export type PayTone = 'green' | 'amber' | 'orange' | 'red';

export interface PayView {
  mode: PayMode;
  payee: {
    /** recipientName ?? merchant ?? QR merchant ?? displayVpa ?? 'Unknown payee'. */
    name: string;
    vpa: string | null;
    /** vpa for @demo handles, maskVpa(vpa) for real-looking ones, null when there is no vpa. */
    displayVpa: string | null;
    verified: boolean;
    /** First letter of name, upper case ('?' when none). */
    initial: string;
  };
  amount: number | null;
  note: string | null;
  score: number;
  level: RiskLevelId;
  /** 'LOW RISK' | 'CAUTION' | 'HIGH CAUTION' | 'HIGH RISK'. */
  levelShort: string;
  tone: PayTone;
  /** report.explanation.headline, e.g. 'Multiple warning signals detected'. */
  headline: string;
  /** Top 3 of report.explanation.reasons with the trailing ' (+16)' points removed. */
  reasons: string[];
  primary: 'cancel' | 'verify' | 'pay';
  /** 'Pay ₹1,999 (demo)' / 'Pay (demo)' in demo-pay mode, otherwise null. */
  payLabel: string | null;
  /** True for HIGH and HIGH_CAUTION: "Pay anyway (demo)" sits behind a 3-second hold. */
  holdToConfirm: boolean;
}

export interface PayContext {
  /** "I'm on a call with them" → behaviour.onCall. */
  onCall?: boolean;
  /** "They asked me to share my screen" → behaviour.screenShare. */
  screenShare?: boolean;
  /** "They said scan to RECEIVE money" → appends RECEIVE_CONTEXT_MESSAGE to the message. */
  scanToReceive?: boolean;
}

export const RECEIVE_CONTEXT_MESSAGE = 'They told me to scan this QR to receive money.';

/** '₹1,999', '₹1,00,000', '₹450.50' (Indian grouping). */
export function formatInr(amount: number): string {
  return fmtINR(amount);
}

/** True for fake demo handles such as 'merchant@demo' (case-insensitive, surrounding spaces ignored). */
export function isDemoVpa(vpa: string | null | undefined): boolean {
  return typeof vpa === 'string' && /@demo$/i.test(vpa.trim());
}

/** 'shop@okaxis' → 'sh•••@okaxis'; 'a@ybl' → 'a•••@ybl'; 'noatsign' → 'no•••'. */
export function maskVpa(vpa: string): string {
  const v = vpa.trim();
  const at = v.indexOf('@');
  const local = at >= 0 ? v.slice(0, at) : v;
  const keep = local.length > 2 ? 2 : Math.min(1, local.length);
  return `${local.slice(0, keep)}•••${at >= 0 ? v.slice(at) : ''}`;
}

export function paymentView(_report: RiskReport): PayView {
  throw new Error('paymentView: not implemented yet');
}

export function withContext(_input: AnalyzeInput, _ctx: PayContext): AnalyzeInput {
  throw new Error('withContext: not implemented yet');
}
