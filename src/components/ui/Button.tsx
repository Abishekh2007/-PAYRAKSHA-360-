import { type ButtonHTMLAttributes, type ReactNode, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { Link, type LinkProps } from 'react-router-dom';

export type ButtonVariant = 'primary' | 'danger' | 'safe' | 'ghost' | 'outline';

// Literal class names: Tailwind only keeps classes it finds verbatim in the source, so never build `btn-${variant}`.
const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: 'btn-primary',
  danger: 'btn-danger',
  safe: 'btn-safe',
  ghost: 'btn-ghost',
  outline: 'btn-outline',
};
const SIZE_CLASS: Record<'sm' | 'md' | 'lg', string> = { sm: 'btn-sm', md: '', lg: 'btn-lg' };

function buttonClasses(variant: ButtonVariant, size: 'sm' | 'md' | 'lg', fullWidth: boolean, className: string) {
  return [VARIANT_CLASS[variant], SIZE_CLASS[size], fullWidth ? 'w-full' : '', className].filter(Boolean).join(' ');
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

export const Button = forwardRef<HTMLButtonElement, ButtonProps>((
  {
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
  },
  ref,
) => {
  return (
    <button
      ref={ref}
      type={type}
      data-size={size}
      className={buttonClasses(variant, size, fullWidth, className)}
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

export const ButtonLink = forwardRef<HTMLAnchorElement, ButtonLinkProps>((
  {
    variant = 'primary',
    size = 'md',
    icon,
    fullWidth = false,
    className = '',
    children,
    ...rest
  },
  ref,
) => {
  return (
    <Link
      ref={ref}
      data-size={size}
      className={buttonClasses(variant, size, fullWidth, className)}
      {...rest}
    >
      {icon}
      {children}
    </Link>
  );
});
ButtonLink.displayName = 'ButtonLink';
