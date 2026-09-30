// STUB: contract only. Builder task `command-center` implements this file.
// The acceptance tests in test/acceptance/payment-twin.test.tsx are written from the comments below.
import type { RiskReport } from '../../types';

/** Nodes of the payment digital twin, in drawing order: the attacker's channels, then you, the checkpoint, the rail, the payee. */
export type TwinNodeId = 'message' | 'call' | 'web' | 'qr' | 'you' | 'checkpoint' | 'upi' | 'recipient';
export type TwinNodeState = 'idle' | 'active' | 'threat' | 'safe' | 'held';

export const TWIN_NODES: TwinNodeId[] = ['message', 'call', 'web', 'qr', 'you', 'checkpoint', 'upi', 'recipient'];

export const TWIN_NODE_LABEL: Record<TwinNodeId, string> = {
  message: 'MESSAGE',
  call: 'CALL',
  web: 'WEB LINK',
  qr: 'QR CODE',
  you: 'YOU',
  checkpoint: 'PAYRAKSHA CHECKPOINT',
  upi: 'UPI RAIL (DEMO)',
  recipient: 'RECIPIENT',
};

/**
 * The route this payment takes through the twin, in order:
 *   the channels present, always in the fixed order message, call, web, qr
 *   → 'you' → 'checkpoint'
 *   → then 'upi', 'recipient' ONLY when report.level is 'LOW' or 'CAUTION'
 *     (a HIGH or HIGH_CAUTION payment is held at the checkpoint and never reaches the rail).
 * A channel is present when:
 *   message: report.input.message is a non-blank string
 *   call:    report.payment.source === 'phone_call' OR report.input.behaviour?.onCall === true
 *   web:     report.analyses.url !== null
 *   qr:      report.analyses.qr !== null
 * null / undefined report → [].
 * Examples (reports from runScenarioLocal in src/engine):
 *   'utility_scam'       (92 HIGH) → ['message', 'web', 'qr', 'you', 'checkpoint']
 *   'customer_care_scam' (88 HIGH) → ['message', 'call', 'qr', 'you', 'checkpoint']
 *   'legit_utility'      (12 LOW)  → ['message', 'qr', 'you', 'checkpoint', 'upi', 'recipient']
 *   'legit_merchant'     (13 LOW)  → ['qr', 'you', 'checkpoint', 'upi', 'recipient']
 */
export function twinPathFor(report: RiskReport | null | undefined): TwinNodeId[] {
  void report;
  return [];
}

/**
 * State of one node. `path` defaults to twinPathFor(report).
 *   no report                → every node 'idle'
 *   node not on the path     → 'idle' (one exception below)
 *   HIGH or HIGH_CAUTION     → channel nodes on the path 'threat', 'you' 'active', 'checkpoint' 'held',
 *                              'recipient' 'threat' (even though it is off the path: the payee is flagged), 'upi' 'idle'
 *   CAUTION                  → every node on the path 'active'
 *   LOW                      → every node on the path 'safe'
 * Example: utility_scam → message/web/qr 'threat', call 'idle', you 'active', checkpoint 'held', upi 'idle', recipient 'threat'.
 */
export function twinNodeState(report: RiskReport | null | undefined, node: TwinNodeId, path?: TwinNodeId[]): TwinNodeState {
  void report;
  void node;
  void path;
  return 'idle';
}

/**
 * HIGH / HIGH_CAUTION → `HELD FOR REVIEW · RISK ${score}`
 * CAUTION             → `CHECK BEFORE YOU PAY · RISK ${score}`
 * LOW                 → `LOW RISK · RISK ${score}`
 * no report           → 'MONITORING'
 * Example: utility_scam → 'HELD FOR REVIEW · RISK 92'.
 */
export function twinCaption(report: RiskReport | null | undefined): string {
  void report;
  return '';
}

export interface PaymentTwinProps {
  report?: RiskReport | null;
  /** Overrides twinPathFor(report). */
  path?: TwinNodeId[];
  /** Shorter drawing for cards; keeps every testid. */
  compact?: boolean;
  className?: string;
}

/**
 * Payment digital twin: a live SVG map of where this payment came from and where it would go.
 * Renders:
 *   - a wrapper with data-testid="payment-twin" and data-level={report?.level ?? 'NONE'}
 *   - an <svg role="img" aria-label="Payment digital twin (simulation)">
 *   - ALL 8 nodes, each an SVG <g data-testid={`twin-node-${id}`} data-state={twinNodeState(report, id, path)}>
 *     containing a <text> with TWIN_NODE_LABEL[id]
 *   - an edge between each pair of consecutive path nodes (animated dash flow, red after a 'threat' node,
 *     green when LOW); when the payment is held, the checkpoint → upi edge is drawn cut
 *   - an element data-testid="twin-caption" whose text is twinCaption(report)
 *   - the visible text 'SIMULATION'
 */
export function PaymentTwin({ report = null, className = '' }: PaymentTwinProps) {
  return (
    <div data-testid="payment-twin-stub" data-level={report?.level ?? 'NONE'} className={className}>
      Payment twin (not built yet)
    </div>
  );
}
