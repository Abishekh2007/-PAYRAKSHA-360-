import { type ButtonHTMLAttributes, type ReactNode, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { Link, type LinkProps } from 'react-router-dom';

export type ButtonVariant = 'primary' | 'danger' | 'safe' | 'ghost' | 'outline';

function buttonClasses(variant: ButtonVariant, fullWidth: boolean, className: string) {
  return `btn-${variant} ${fullWidth ? 'w-full' : ''} ${className}`.trim();
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  /** Icon element shown before the label. */
  icon?: ReactNode;
  /** Shows a spinner, sets aria-busy and disables the button. */
  loading?: boolean;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  fullWidth = false,
  className = '',
  children,
  disabled,
  type = 'button',
  ...rest
}, ref) => {
  return (
    <button
      ref={ref}
      type={type}
      data-size={size}
      className={buttonClasses(variant, fullWidth, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <Loader2 className="animate-spin w-4 h-4" /> : icon}
      {children}
    </button>
  );
});
Button.displayName = 'Button';

export interface ButtonLinkProps extends LinkProps {
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
  fullWidth?: boolean;
}

export const ButtonLink = forwardRef<HTMLAnchorElement, ButtonLinkProps>(({
  variant = 'primary',
  size = 'md',
  icon,
  fullWidth = false,
  className = '',
  children,
  ...rest
}, ref) => {
  return (
    <Link
      ref={ref}
      data-size={size}
      className={buttonClasses(variant, fullWidth, className)}
      {...rest}
    >
      {icon}
      {children}
    </Link>
  );
});
ButtonLink.displayName = 'ButtonLink';
