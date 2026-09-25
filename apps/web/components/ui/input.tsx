import * as React from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  lowConfidence?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, lowConfidence, className, ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label && (
          <label className="block text-xs font-semibold uppercase tracking-wider text-ark-text-muted">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full bg-ark-bg-elevated border rounded px-3 py-2 text-ark-text-primary text-sm',
            'placeholder:text-ark-text-faint',
            'focus:outline-none focus:border-ark-primary focus:ring-1 focus:ring-ark-primary',
            'transition-colors duration-150',
            lowConfidence ? 'border-yellow-600 border-l-4' : 'border-ark-border',
            error && 'border-ark-danger',
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-xs text-ark-danger mt-1">{error}</p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label && (
          <label className="block text-xs font-semibold uppercase tracking-wider text-ark-text-muted">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={cn(
            'w-full bg-ark-bg-elevated border border-ark-border rounded px-3 py-2',
            'text-ark-text-primary text-sm placeholder:text-ark-text-faint resize-y',
            'focus:outline-none focus:border-ark-primary focus:ring-1 focus:ring-ark-primary',
            'transition-colors duration-150',
            error && 'border-ark-danger',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-ark-danger mt-1">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';
