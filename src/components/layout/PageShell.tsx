import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

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
  const reducedMotion = useReducedMotion();

  const maxWidth = {
    narrow: 'max-w-3xl',
    default: 'max-w-6xl',
    wide: 'max-w-7xl',
  }[width];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  const baseVariants = reducedMotion ? {} : containerVariants;
  const childVariants = reducedMotion ? {} : itemVariants;

  return (
    <motion.section
      data-width={width}
      className={`mx-auto w-full px-4 py-8 md:px-8 md:py-12 ${maxWidth} ${className}`}
      initial="hidden"
      animate="visible"
      variants={baseVariants}
    >
      <motion.header variants={childVariants} className="mb-8 flex flex-col gap-5 md:mb-12 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col items-start gap-4">
          {eyebrow && (
            <div className="chip border-brand-400/30 bg-brand-400/10 text-brand-300">
              {icon && <span className="flex-shrink-0">{icon}</span>}
              <span>{eyebrow}</span>
            </div>
          )}
          <h1 className="flex items-center gap-3 font-display text-3xl font-bold tracking-tight text-white md:text-5xl lg:text-[3.5rem] lg:leading-tight">
            {!eyebrow && icon && <span className="text-brand-300 flex-shrink-0">{icon}</span>}
            {title}
          </h1>
          {subtitle && <p className="max-w-2xl text-lg text-slate-400 md:text-xl">{subtitle}</p>}
        </div>

        {actions && (
          <div className="mt-2 flex flex-shrink-0 flex-wrap items-center gap-3 md:mt-0">
            {actions}
          </div>
        )}
      </motion.header>

      <motion.div variants={childVariants} className="w-full">
        {children}
      </motion.div>
    </motion.section>
  );
}
