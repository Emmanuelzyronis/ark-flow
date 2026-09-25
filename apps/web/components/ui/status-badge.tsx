import { cn } from '@/lib/utils';

type InvoiceStatus = 'RECEIVED' | 'EXTRACTED' | 'PENDING' | 'MATCHED' | 'OVERDUE' | 'CHASED' | 'PAID' | 'ARCHIVED';

const statusConfig: Record<InvoiceStatus, { label: string; className: string }> = {
  RECEIVED: { label: 'RECEIVED', className: 'bg-slate-800 text-slate-300 border-slate-700' },
  EXTRACTED: { label: 'EXTRACTED', className: 'bg-blue-900/30 text-blue-300 border-blue-800/50' },
  PENDING: { label: 'PENDING', className: 'bg-ark-warning-bg text-yellow-400 border-yellow-800/50' },
  MATCHED: { label: 'MATCHED', className: 'bg-ark-info-bg text-ark-info border-ark-info/30' },
  OVERDUE: { label: 'OVERDUE', className: 'bg-ark-danger-bg text-ark-danger border-red-800/50 animate-pulse-danger' },
  CHASED: { label: 'CHASED', className: 'bg-ark-primary-muted text-ark-primary border-ark-primary/30' },
  PAID: { label: 'PAID', className: 'bg-ark-success-bg text-ark-success border-green-800/50' },
  ARCHIVED: { label: 'ARCHIVED', className: 'bg-ark-bg-elevated text-ark-text-faint border-ark-border' },
};

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
  className?: string;
}

export function StatusBadge({ status, size = 'sm', className }: StatusBadgeProps) {
  const config = statusConfig[status as InvoiceStatus] ?? {
    label: status,
    className: 'bg-ark-bg-card text-ark-text-muted border-ark-border',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-mono font-semibold tracking-wider border rounded',
        size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-xs',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}

export function AgingLabel({ due_date, status }: { due_date?: string | null; status: string }) {
  if (!due_date || ['PAID', 'ARCHIVED'].includes(status)) return null;
  const days = Math.floor((Date.now() - new Date(due_date).getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return null;

  let label = '30d';
  let cls = 'bg-yellow-900/30 text-yellow-400 border-yellow-800/50';
  if (days > 90) { label = '90d+'; cls = 'bg-red-900/40 text-red-400 border-red-800/50'; }
  else if (days > 60) { label = '90d'; cls = 'bg-red-900/30 text-red-400 border-red-800/50'; }
  else if (days > 30) { label = '60d'; cls = 'bg-orange-900/30 text-orange-400 border-orange-800/50'; }

  return (
    <span className={cn('inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-semibold tracking-wider border rounded', cls)}>
      {label}
    </span>
  );
}

export function ConfidenceBadge({ score }: { score?: number | null }) {
  if (score == null) return null;
  const pct = Math.round(score * 100);
  let cls = 'bg-ark-success-bg text-ark-success border-green-800/50';
  if (pct < 70) cls = 'bg-ark-danger-bg text-ark-danger border-red-800/50';
  else if (pct < 90) cls = 'bg-ark-warning-bg text-yellow-400 border-yellow-800/50';

  return (
    <span
      title={`Claude extracted with ${pct}% confidence`}
      className={cn('inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-semibold tracking-wider border rounded cursor-help', cls)}
    >
      {pct}%
    </span>
  );
}
