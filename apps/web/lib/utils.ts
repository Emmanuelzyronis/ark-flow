import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function getAgingLabel(due_date: string | null | undefined, status: string): string {
  if (!due_date || ['PAID', 'ARCHIVED'].includes(status)) return '';
  const days = Math.floor((Date.now() - new Date(due_date).getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return 'Due soon';
  if (days <= 30) return '30d';
  if (days <= 60) return '60d';
  if (days <= 90) return '90d';
  return '90d+';
}

export function getDaysOverdue(due_date: string | null | undefined): number {
  if (!due_date) return 0;
  return Math.max(0, Math.floor((Date.now() - new Date(due_date).getTime()) / (1000 * 60 * 60 * 24)));
}

export function relativeTime(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(date);
}
