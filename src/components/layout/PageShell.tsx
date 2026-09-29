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
