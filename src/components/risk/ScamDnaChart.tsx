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
