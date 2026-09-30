import type { ReactNode } from 'react';

export interface SectionHeaderProps {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  icon?: ReactNode;
  align?: 'left' | 'center';
  className?: string;
  actions?: ReactNode;
}

export function SectionHeader({ eyebrow, title, subtitle, icon, align = 'left', className = '', actions }: SectionHeaderProps) {
  return (
    <div className={`flex flex-col gap-2 ${align === 'center' ? 'text-center items-center' : 'text-left items-start'} ${className}`.trim()}>
      <div className="flex w-full justify-between items-start gap-4">
        <div className={`flex flex-col gap-1 ${align === 'center' ? 'items-center mx-auto' : ''}`}>
          {eyebrow && <p className="hud-eyebrow">{eyebrow}</p>}
          <h2 className="hud-title flex items-center gap-2 text-base">
            {icon}
            {title}
          </h2>
          {subtitle && <p className="text-sm text-slate-400">{subtitle}</p>}
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>
      <hr className="hud-rule w-full" />
    </div>
  );
}
