'use client';

import { useToasts, type ToastVariant } from '@/hooks/use-toast';

const VARIANT_STYLES: Record<ToastVariant, string> = {
  success: 'bg-ark-success-bg border-ark-success/40 text-ark-success',
  error: 'bg-ark-danger-bg border-ark-danger/40 text-ark-danger',
  info: 'bg-ark-bg-card border-ark-border text-ark-text-primary',
};

const ICONS: Record<ToastVariant, string> = {
  success: '✓',
  error: '⚠',
  info: 'ℹ',
};

export function ToastContainer() {
  const toasts = useToasts();
  if (toasts.length === 0) return null;
  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className={`flex items-center gap-2.5 px-4 py-3 rounded-lg border shadow-card text-sm font-medium max-w-xs transition-all duration-200 ${VARIANT_STYLES[t.variant]}`}
        >
          <span className="text-base leading-none flex-shrink-0" aria-hidden="true">
            {ICONS[t.variant]}
          </span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}
