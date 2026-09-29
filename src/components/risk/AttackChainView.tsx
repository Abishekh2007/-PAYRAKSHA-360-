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
