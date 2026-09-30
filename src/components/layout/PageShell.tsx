import type { ReactNode } from 'react';

export interface PageShellProps {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  icon?: ReactNode;
  /** Right-aligned header content (buttons, badges). */
  actions?: ReactNode;
  /** narrow = max-w-3xl, default = max-w-7xl, wide = max-w-[96rem]. */
  width?: 'narrow' | 'default' | 'wide';
  className?: string;
  children: ReactNode;
}

export function PageShell({
  eyebrow,
  title,
  subtitle,
  icon,
  actions,
  width = 'default',
  className = '',
  children,
}: PageShellProps) {
  const maxWidth = {
    narrow: 'max-w-3xl',
    default: 'max-w-7xl',
    wide: 'max-w-[96rem]',
  }[width];

  return (
    <section
      data-width={width}
      className={`mx-auto w-full px-4 py-6 md:px-6 ${maxWidth} ${className}`}
    >
      <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-2">
          {eyebrow && (
            <div className="flex items-center gap-2">
              {icon && <span className="text-cyan-400">{icon}</span>}
              <div className="hud-eyebrow text-cyan-400 flex items-center gap-1">
                <span aria-hidden="true">//</span>
                <span>{eyebrow}</span>
              </div>
            </div>
          )}
          {!eyebrow && icon && (
            <span className="text-cyan-400">{icon}</span>
          )}
          <h1 className="font-mono text-2xl font-semibold uppercase tracking-tight text-white md:text-3xl">
            {title}
          </h1>
          {subtitle && (
            <p className="max-w-3xl text-sm text-slate-400">{subtitle}</p>
          )}
        </div>

        {actions && (
          <div className="flex flex-shrink-0 flex-wrap items-center gap-3">
            {actions}
          </div>
        )}
      </header>

      <div className="hud-rule mb-6" />

      <div className="w-full">{children}</div>
    </section>
  );
}
