// STUB: replaced by the ui-kit task. Keep the export name and props.
import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'danger' | 'safe' | 'ghost' | 'outline';
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  /** Icon element shown before the label. */
  icon?: ReactNode;
  /** Shows a spinner, sets aria-busy and disables the button. */
  loading?: boolean;
  fullWidth?: boolean;
}

export function Button({ variant = 'primary', size = 'md', icon, loading = false, fullWidth = false, className = '', children, disabled, type = 'button', ...rest }: ButtonProps) {
  return (
    <button type={type} data-size={size} className={`btn-${variant} ${fullWidth ? 'w-full' : ''} ${className}`} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {icon}
      {children}
    </button>
  );
}
