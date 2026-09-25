import * as React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 font-medium rounded transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ark-primary focus-visible:ring-offset-2 focus-visible:ring-offset-ark-bg disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary:
      'bg-ark-primary text-white hover:bg-ark-primary-hover active:bg-ark-primary-dim shadow-glow-primary-sm hover:shadow-glow-primary',
    secondary:
      'bg-ark-bg-card text-ark-text-primary border border-ark-border hover:border-ark-border-bright hover:bg-ark-bg-surface',
    ghost:
      'text-ark-text-secondary hover:text-ark-text-primary hover:bg-ark-bg-elevated',
    danger:
      'bg-ark-danger text-white hover:bg-red-700',
    outline:
      'border border-ark-primary text-ark-primary hover:bg-ark-primary-muted',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled ?? loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
}
