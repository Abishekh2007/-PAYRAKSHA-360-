import { useReducedMotion } from 'framer-motion';
import type { RiskReport } from '../../types';
import { fmtINR } from '../../engine';
import { StatusPill } from './StatusPill';

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
 */
export function twinPathFor(report: RiskReport | null | undefined): TwinNodeId[] {
  if (!report) return [];

  const channels: TwinNodeId[] = [];

  if (report.input.message && report.input.message.trim() !== '') {
    channels.push('message');
  }
  if (report.payment.source === 'phone_call' || report.input.behaviour?.onCall === true) {
    channels.push('call');
  }
  if (report.analyses.url !== null && report.analyses.url !== undefined) {
    channels.push('web');
  }
  if (report.analyses.qr !== null && report.analyses.qr !== undefined) {
    channels.push('qr');
  }

  const path: TwinNodeId[] = [...channels, 'you', 'checkpoint'];

  if (report.level === 'LOW' || report.level === 'CAUTION') {
    path.push('upi', 'recipient');
  }

  return path;
}

/**
 * State of one node. `path` defaults to twinPathFor(report).
 *   no report                → every node 'idle'
 *   node not on the path     → 'idle' (one exception below)
 *   HIGH or HIGH_CAUTION     → channel nodes on the path 'threat', 'you' 'active', 'checkpoint' 'held',
 *                              'recipient' 'threat' (even though it is off the path: the payee is flagged), 'upi' 'idle'
 *   CAUTION                  → every node on the path 'active'
 *   LOW                      → every node on the path 'safe'
 */
export function twinNodeState(report: RiskReport | null | undefined, node: TwinNodeId, path?: TwinNodeId[]): TwinNodeState {
  if (!report) return 'idle';

  const effectivePath = path ?? twinPathFor(report);
  const level = report.level;
  const isHigh = level === 'HIGH' || level === 'HIGH_CAUTION';

  if (isHigh) {
    // Special case: recipient is always 'threat' even if not on the path
    if (node === 'recipient') return 'threat';
    // upi is always idle for high risk
    if (node === 'upi') return 'idle';
    if (!effectivePath.includes(node)) return 'idle';
    // On the path nodes
    if (node === 'checkpoint') return 'held';
    if (node === 'you') return 'active';
    // Channel nodes (message, call, web, qr) on the path → threat
    return 'threat';
  }

  if (!effectivePath.includes(node)) return 'idle';

  if (level === 'CAUTION') return 'active';
  if (level === 'LOW') return 'safe';

  return 'idle';
}

/**
 * HIGH / HIGH_CAUTION → `HELD FOR REVIEW · RISK ${score}`
 * CAUTION             → `CHECK BEFORE YOU PAY · RISK ${score}`
 * LOW                 → `LOW RISK · RISK ${score}`
 * no report           → 'MONITORING'
 */
export function twinCaption(report: RiskReport | null | undefined): string {
  if (!report) return 'MONITORING';

  const score = report.score;
  switch (report.level) {
    case 'HIGH':
    case 'HIGH_CAUTION':
      return `HELD FOR REVIEW · RISK ${score}`;
    case 'CAUTION':
      return `CHECK BEFORE YOU PAY · RISK ${score}`;
    case 'LOW':
      return `LOW RISK · RISK ${score}`;
    default:
      return 'MONITORING';
  }
}

export interface PaymentTwinProps {
  report?: RiskReport | null;
  /** Overrides twinPathFor(report). */
  path?: TwinNodeId[];
  /** Shorter drawing for cards; keeps every testid. */
  compact?: boolean;
  className?: string;
}

// Node state → SVG colours
const STATE_STROKE: Record<TwinNodeState, string> = {
  idle: '#334155',
  active: '#22d3ee',
  threat: '#ef4444',
  safe: '#22c55e',
  held: '#f59e0b',
};
const STATE_TEXT: Record<TwinNodeState, string> = {
  idle: '#475569',
  active: '#22d3ee',
  threat: '#ef4444',
  safe: '#22c55e',
  held: '#f59e0b',
};

interface NodePos {
  x: number;
  y: number;
  width: number;
  height: number;
}

function getNodePositions(compact: boolean): Record<TwinNodeId, NodePos> {
  const nodeW = 100;
  const nodeH = 28;

  const channelX = 30;
  const channelStartY = compact ? 30 : 50;
  const channelGapY = compact ? 42 : 52;

  const youX = 260;
  const youY = compact ? 80 : 110;

  const cpX = 420;
  const cpY = compact ? 80 : 110;
  const cpW = 130;
  const cpH = 36;

  const rightX = 590;
  const upiY = compact ? 55 : 80;
  const recipientY = compact ? 130 : 170;

  return {
    message: { x: channelX, y: channelStartY, width: nodeW, height: nodeH },
    call: { x: channelX, y: channelStartY + channelGapY, width: nodeW, height: nodeH },
    web: { x: channelX, y: channelStartY + channelGapY * 2, width: nodeW, height: nodeH },
    qr: { x: channelX, y: channelStartY + channelGapY * 3, width: nodeW, height: nodeH },
    you: { x: youX, y: youY, width: nodeW, height: nodeH },
    checkpoint: { x: cpX, y: cpY, width: cpW, height: cpH },
    upi: { x: rightX, y: upiY, width: nodeW, height: nodeH },
    recipient: { x: rightX, y: recipientY, width: nodeW, height: nodeH },
  };
}

function nodeCentre(pos: NodePos): [number, number] {
  return [pos.x + pos.width / 2, pos.y + pos.height / 2];
}

function curvePath(from: NodePos, to: NodePos): string {
  const [x1, y1] = nodeCentre(from);
  const [x2, y2] = nodeCentre(to);
  const mx = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${mx} ${y1} ${mx} ${y2} ${x2} ${y2}`;
}

function linePath(from: NodePos, to: NodePos): string {
  const [x1, y1] = nodeCentre(from);
  const [x2, y2] = nodeCentre(to);
  return `M ${x1} ${y1} L ${x2} ${y2}`;
}

interface SvgNodeProps {
  id: TwinNodeId;
  state: TwinNodeState;
  pos: NodePos;
}

function SvgNode({ id, state, pos }: SvgNodeProps) {
  const bgAlpha = state === 'idle' ? '' : '22';
  const bgColor = state === 'idle' ? '#0f172a' : STATE_STROKE[state] + bgAlpha;
  const stroke = STATE_STROKE[state];
  const textFill = STATE_TEXT[state];
  const label = TWIN_NODE_LABEL[id];
  const cx = pos.x + pos.width / 2;
  const cy = pos.y + pos.height / 2;

  return (
    <g data-testid={`twin-node-${id}`} data-state={state}>
      {state === 'threat' && (
        <rect
          x={pos.x - 2}
          y={pos.y - 2}
          width={pos.width + 4}
          height={pos.height + 4}
          rx={4}
          fill="none"
          stroke="#ef4444"
          strokeWidth={1}
          opacity={0.3}
        />
      )}
      <rect
        x={pos.x}
        y={pos.y}
        width={pos.width}
        height={pos.height}
        rx={3}
        fill={bgColor}
        stroke={stroke}
        strokeWidth={state === 'idle' ? 0.5 : 1}
        opacity={state === 'idle' ? 0.6 : 1}
      />
      <text
        x={cx}
        y={cy + 4}
        fontSize={9}
        fill={textFill}
        fontFamily="monospace"
        letterSpacing={1.5}
        textAnchor="middle"
        className="font-mono"
      >
        {label}
      </text>
    </g>
  );
}

/**
 * Payment digital twin: a live SVG map of where this payment came from and where it would go.
 */
export function PaymentTwin({ report = null, path: pathProp, compact = false, className = '' }: PaymentTwinProps) {
  const reducedMotion = useReducedMotion();
  const effectivePath = pathProp ?? twinPathFor(report);
  const level = report?.level ?? null;
  const isHigh = level === 'HIGH' || level === 'HIGH_CAUTION';
  const isLow = level === 'LOW';

  const positions = getNodePositions(compact);
  const caption = twinCaption(report);

  function edgeColor(fromId: TwinNodeId): string {
    if (isLow) return '#22c55e';
    const fromState = twinNodeState(report, fromId, effectivePath);
    if (fromState === 'threat' || fromState === 'held') return '#ef4444';
    if (fromState === 'active') return '#22d3ee';
    if (fromState === 'safe') return '#22c55e';
    return '#22d3ee';
  }

  const dashClass = reducedMotion ? '' : 'animate-dash-flow';

  // Build edges between consecutive path nodes
  const edges: Array<{ from: TwinNodeId; to: TwinNodeId; cut: boolean }> = [];
  for (let i = 0; i + 1 < effectivePath.length; i++) {
    const from = effectivePath[i];
    const to = effectivePath[i + 1];
    const cut = isHigh && from === 'checkpoint' && to === 'upi';
    edges.push({ from, to, cut });
  }

  // Handle / amount info
  const handle = report?.payment.recipient ?? 'unknown@demo';
  const amount = report?.payment.amount;
  const amountStr = typeof amount === 'number' ? fmtINR(amount) : null;
  const recipientPos = positions.recipient;
  const recipientCx = recipientPos.x + recipientPos.width / 2;
  const recipientBottom = recipientPos.y + recipientPos.height + 12;

  const viewBox = compact ? '0 0 720 220' : '0 0 720 300';

  const CHANNEL_IDS: Set<TwinNodeId> = new Set(['message', 'call', 'web', 'qr']);

  return (
    <div data-testid="payment-twin" data-level={report?.level ?? 'NONE'} className={`flex flex-col gap-2 ${className}`}>
      <svg
        role="img"
        aria-label="Payment digital twin (simulation)"
        viewBox={viewBox}
        width="100%"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: 'block' }}
      >
        <defs>
          <pattern id="twin-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#twin-grid)" opacity={0.3} />

        {/* Edges */}
        {edges.map(({ from, to, cut }) => {
          const fromPos = positions[from];
          const toPos = positions[to];

          if (cut) {
            const [fx, fy] = nodeCentre(fromPos);
            const [tx, ty] = nodeCentre(toPos);
            const midX = (fx + tx) / 2;
            const midY = (fy + ty) / 2;
            return (
              <g key={`edge-${from}-${to}`}>
                <path d={linePath(fromPos, toPos)} fill="none" stroke="#475569" strokeWidth={1} strokeDasharray="4 4" opacity={0.5} />
                <text x={midX} y={midY - 4} fontSize={10} fill="#ef4444" textAnchor="middle" fontFamily="monospace">✕</text>
                <text x={midX} y={midY + 12} fontSize={8} fill="#f59e0b" textAnchor="middle" fontFamily="monospace" letterSpacing={1}>HELD</text>
              </g>
            );
          }

          const isChannelToYou = to === 'you' && CHANNEL_IDS.has(from);
          const d = isChannelToYou ? curvePath(fromPos, toPos) : linePath(fromPos, toPos);
          const color = edgeColor(from);

          return (
            <path
              key={`edge-${from}-${to}`}
              d={d}
              fill="none"
              stroke={color}
              strokeWidth={1.5}
              strokeDasharray="6 6"
              className={dashClass}
              opacity={0.7}
            />
          );
        })}

        {/* All 8 nodes */}
        {TWIN_NODES.map((id) => {
          const state = twinNodeState(report, id, effectivePath);
          const pos = positions[id];
          return <SvgNode key={id} id={id} state={state} pos={pos} />;
        })}

        {/* Handle / amount label under recipient */}
        {report && (
          <>
            <text x={recipientCx} y={recipientBottom} fontSize={8} fill="#64748b" textAnchor="middle" fontFamily="monospace" letterSpacing={0.8}>
              {handle}
            </text>
            {amountStr && (
              <text x={recipientCx} y={recipientBottom + 12} fontSize={8} fill="#64748b" textAnchor="middle" fontFamily="monospace" letterSpacing={0.8}>
                {amountStr} DEMO
              </text>
            )}
          </>
        )}
      </svg>

      {/* Caption and simulation pill */}
      <div className="flex items-center justify-between gap-2 px-1">
        <span
          data-testid="twin-caption"
          className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-400"
        >
          {caption}
        </span>
        <StatusPill tone="cyan">SIMULATION</StatusPill>
      </div>
    </div>
  );
}
