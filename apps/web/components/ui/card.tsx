import * as React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export function Card({ className, hover, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'bg-ark-bg-card border border-ark-border rounded-lg shadow-card',
        hover && 'hover:shadow-card-hover hover:border-ark-primary/25 transition-all duration-200 cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('px-5 pt-5 pb-3', className)} {...props}>
      {children}
    </div>
  );
}

export function CardBody({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('px-5 pb-5', className)} {...props}>
      {children}
    </div>
  );
}

export function KPICard({
  label,
  value,
  subtitle,
  variant = 'default',
  loading,
}: {
  label: string;
  value: string | number;
  subtitle?: string;
  variant?: 'default' | 'danger' | 'success' | 'warning';
  loading?: boolean;
}) {
  const variantColors = {
    default: 'text-ark-primary',
    danger: 'text-ark-danger',
    success: 'text-ark-success',
    warning: 'text-yellow-400',
  };

  return (
    <Card>
      <CardBody>
        {loading ? (
          <div className="space-y-2">
            <div className="h-4 w-24 shimmer rounded" />
            <div className="h-8 w-32 shimmer rounded" />
          </div>
        ) : (
          <>
            <p className="text-ark-text-muted text-xs font-semibold tracking-wider uppercase mb-1">
              {label}
            </p>
            <p className={cn('text-2xl font-bold tabular-nums', variantColors[variant])}>
              {value}
            </p>
            {subtitle && (
              <p className="text-ark-text-faint text-xs mt-1">{subtitle}</p>
            )}
          </>
        )}
      </CardBody>
    </Card>
  );
}
