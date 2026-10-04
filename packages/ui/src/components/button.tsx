import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../format';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'danger-quiet';
export type ButtonSize = 'sm' | 'md';

const base =
  'inline-flex min-h-10 max-md:min-h-11 items-center justify-center gap-2 rounded-md px-4 text-small font-medium whitespace-nowrap transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed';

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-accent-fg hover:bg-accent-hover',
  secondary: 'border border-border-strong bg-surface text-fg hover:bg-surface-sunken',
  danger: 'bg-negative text-negative-fg hover:opacity-90',
  'danger-quiet': 'border border-negative/50 text-negative hover:bg-negative-subtle',
  ghost: 'text-fg-secondary hover:bg-surface-sunken hover:text-fg',
};

const sizeClasses: Record<ButtonSize, string> = {
  md: '',
  sm: 'min-h-8 px-2.5 text-micro',
};

export function buttonClassName(variant: ButtonVariant = 'primary', size: ButtonSize = 'md', className?: string) {
  return cn(base, variantClasses[variant], sizeClasses[size], className);
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({ variant = 'primary', size = 'md', className, ...props }: ButtonProps) {
  return <button className={buttonClassName(variant, size, className)} {...props} />;
}

export interface LinkButtonProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  external?: boolean;
  children: ReactNode;
}

export function LinkButton({ href, variant = 'primary', size = 'md', external, className, children, ...props }: LinkButtonProps) {
  return (
    <a
      href={href}
      className={buttonClassName(variant, size, className)}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      {...props}
    >
      {children}
    </a>
  );
}
