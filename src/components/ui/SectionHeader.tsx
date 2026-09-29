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
