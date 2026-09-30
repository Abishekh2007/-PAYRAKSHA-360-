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

export function paymentView(report: RiskReport): PayView {
  const { payment, analyses, score, level, levelLabel, explanation } = report;

  // Determine mode
  const vpa = payment.recipient ?? null;
  let mode: PayMode;
  if (!vpa) {
    mode = 'not-payment';
  } else if (isDemoVpa(vpa)) {
    mode = 'demo-pay';
  } else {
    mode = 'analysis-only';
  }

  // displayVpa
  let displayVpa: string | null;
  if (!vpa) {
    displayVpa = null;
  } else if (mode === 'demo-pay') {
    displayVpa = vpa;
  } else {
    displayVpa = maskVpa(vpa);
  }

  // Name fallback chain: recipientName ?? merchant ?? QR merchant ?? displayVpa ?? 'Unknown payee'
  const name =
    payment.recipientName ??
    payment.merchant ??
    (analyses.qr?.fields?.merchant ?? null) ??
    displayVpa ??
    'Unknown payee';

  const verified = payment.recipientVerified === true;
  const initial = name.length > 0 ? name[0].toUpperCase() : '?';

  // Amount and note
  const amount = payment.amount ?? null;
  const note = analyses.qr?.fields?.note ?? null;

  // Tone
  const toneMap: Record<RiskLevelId, PayTone> = {
    LOW: 'green',
    CAUTION: 'amber',
    HIGH_CAUTION: 'orange',
    HIGH: 'red',
  };
  const tone = toneMap[level];

  // levelShort
  const levelShort = levelLabel;

  // headline and reasons
  const headline = explanation.headline;
  const reasons = explanation.reasons
    .slice(0, 3)
    .map((r) => r.replace(/\s*\(\+\d+\)\s*$/, ''));

  // Primary action
  let primary: 'cancel' | 'verify' | 'pay';
  if (level === 'HIGH' || level === 'HIGH_CAUTION') {
    primary = 'cancel';
  } else if (level === 'CAUTION') {
    primary = 'verify';
  } else {
    // LOW
    primary = mode === 'demo-pay' ? 'pay' : 'verify';
  }

  // payLabel
  let payLabel: string | null = null;
  if (mode === 'demo-pay') {
    if (amount !== null) {
      payLabel = `Pay ${formatInr(amount)} (demo)`;
    } else {
      payLabel = 'Pay (demo)';
    }
  }

  // holdToConfirm
  const holdToConfirm = level === 'HIGH' || level === 'HIGH_CAUTION';

  return {
    mode,
    payee: {
      name,
      vpa,
      displayVpa,
      verified,
      initial,
    },
    amount,
    note,
    score,
    level,
    levelShort,
    tone,
    headline,
    reasons,
    primary,
    payLabel,
    holdToConfirm,
  };
}

export function withContext(input: AnalyzeInput, ctx: PayContext): AnalyzeInput {
  // Never mutate input; create a shallow copy
  const result: AnalyzeInput = { ...input };

  // Handle behaviour keys: onCall and screenShare
  const behaviourKeys: Array<'onCall' | 'screenShare'> = ['onCall', 'screenShare'];
  const behaviourUpdates: Record<string, boolean> = {};
  let hasBehaviourUpdate = false;

  for (const key of behaviourKeys) {
    if (ctx[key] !== undefined) {
      behaviourUpdates[key] = ctx[key] as boolean;
      hasBehaviourUpdate = true;
    }
  }

  if (hasBehaviourUpdate || result.behaviour) {
    result.behaviour = { ...(result.behaviour ?? {}), ...behaviourUpdates };
  }

  // Handle scanToReceive
  if (ctx.scanToReceive === true) {
    const existing = result.message ?? '';
    if (!existing.includes(RECEIVE_CONTEXT_MESSAGE)) {
      if (existing) {
        result.message = `${existing}\n${RECEIVE_CONTEXT_MESSAGE}`;
      } else {
        result.message = RECEIVE_CONTEXT_MESSAGE;
      }
    } else {
      // Already present, keep as is
      result.message = existing;
    }
  } else if (ctx.scanToReceive === false) {
    if (result.message) {
      // Remove the RECEIVE_CONTEXT_MESSAGE along with surrounding newline
      let msg = result.message;
      // Remove with preceding newline
      msg = msg.replace(new RegExp(`\\n?${escapeRegex(RECEIVE_CONTEXT_MESSAGE)}`, 'g'), '');
      // Trim leading/trailing whitespace
      msg = msg.trim();
      result.message = msg || undefined;
    }
  }
  // If scanToReceive is undefined, leave message alone

  return result;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
