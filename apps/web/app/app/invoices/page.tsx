'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { invoicesApi } from '@/lib/api';
import { formatCurrency, formatDate, getDaysOverdue } from '@/lib/utils';
import { StatusBadge, AgingLabel } from '@/components/ui/status-badge';

const TABS = ['ALL', 'PENDING', 'OVERDUE', 'CHASED', 'PAID'] as const;

interface Invoice {
  id: string;
  vendor_name?: string;
  invoice_number?: string;
  total_amount: string;
  currency: string;
  due_date?: string;
  status: string;
  created_at: string;
}

interface ListResponse {
  invoices: Invoice[];
  total: number;
  page: number;
  pages: number;
  summary: { total_outstanding: string; total_overdue: string };
}

export default function InvoicesPage() {
  const [tab, setTab] = useState<string>('ALL');
  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    invoicesApi
      .list({ status: tab === 'ALL' ? undefined : tab, page, limit: 20 })
      .then((res) => setData(res as ListResponse))
      .catch((err) => {
        console.error(err);
        setError('Could not load invoices. Check your connection and try again.');
      })
      .finally(() => setLoading(false));
  }, [tab, page]);

  return (
    <div className="p-4 md:p-8">
      {error && (
        <div className="bg-ark-danger-bg border border-ark-danger/30 rounded-lg p-3 mb-5 flex items-center gap-2">
          <span className="text-ark-danger text-sm" aria-hidden="true">⚠</span>
          <p className="text-sm text-ark-danger">{error}</p>
        </div>
      )}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ark-text-primary">Invoices</h1>
          <p className="text-ark-text-muted text-sm mt-1">
            {data ? (
              <>
                Outstanding: <span className="tabular-nums text-ark-primary">{formatCurrency(Number(data.summary?.total_outstanding ?? 0))}</span>
                {' · '}
                Overdue: <span className="tabular-nums text-ark-danger">{formatCurrency(Number(data.summary?.total_overdue ?? 0))}</span>
              </>
            ) : 'Loading…'}
          </p>
        </div>
        <Link
          href="/app/invoices/upload"
          className="flex items-center gap-2 bg-ark-primary hover:bg-ark-primary-hover text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-glow-primary-sm"
        >
          + Upload Invoice
        </Link>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-5 bg-ark-bg-elevated rounded-lg p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setPage(1); }}
            className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
              tab === t
                ? 'bg-ark-bg-card text-ark-text-primary shadow-card'
                : 'text-ark-text-muted hover:text-ark-text-primary'
            }`}
          >
            {t}
            {t === 'OVERDUE' && data && data.invoices.filter((i) => i.status === 'OVERDUE').length > 0 && (
              <span className="ml-1.5 bg-ark-danger text-white text-[10px] px-1 py-0.5 rounded-full animate-pulse-danger">
                {data.invoices.filter((i) => i.status === 'OVERDUE').length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-ark-bg-card border border-ark-border rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 shimmer rounded" />
            ))}
          </div>
        ) : !data || data.invoices.length === 0 ? (
          <div className="p-16 text-center">
            <div className="text-3xl mb-3">📄</div>
            <h3 className="font-semibold text-ark-text-primary mb-1">No invoices</h3>
            <p className="text-ark-text-muted text-sm mb-4">
              {tab === 'ALL' ? 'Upload your first invoice to get started.' : `No ${tab.toLowerCase()} invoices found.`}
            </p>
            <Link
              href="/app/invoices/upload"
              className="inline-block bg-ark-primary text-white px-4 py-2 rounded text-sm font-medium hover:bg-ark-primary-hover transition-colors"
            >
              Upload Invoice
            </Link>
          </div>
        ) : (
          <>
            {/* Mobile card list */}
            <div className="md:hidden divide-y divide-ark-border">
              {data.invoices.map((invoice) => {
                const daysOverdue = getDaysOverdue(invoice.due_date);
                return (
                  <div key={invoice.id} className="p-4 flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-sm text-ark-text-primary truncate">
                        {invoice.vendor_name ?? 'Unknown'}
                      </span>
                      <StatusBadge status={invoice.status} />
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-ark-text-faint font-mono">
                        {invoice.invoice_number ?? '—'}
                      </span>
                      <span className="tabular-nums font-semibold text-ark-text-primary">
                        {formatCurrency(Number(invoice.total_amount), invoice.currency)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-ark-text-muted">
                        <span>{formatDate(invoice.due_date)}</span>
                        {daysOverdue > 0 && !['PAID', 'ARCHIVED'].includes(invoice.status) && (
                          <span className="text-ark-danger font-medium">{daysOverdue}d overdue</span>
                        )}
                      </div>
                      <Link href={`/app/invoices/${invoice.id}`} className="text-xs text-ark-primary font-medium">
                        View →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-ark-border">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-ark-text-faint">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-ark-text-faint">Vendor</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-ark-text-faint">Invoice #</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-ark-text-faint">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-ark-text-faint">Due Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-ark-text-faint">Aging</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-ark-border">
                  {data.invoices.map((invoice) => {
                    const daysOverdue = getDaysOverdue(invoice.due_date);
                    return (
                      <tr
                        key={invoice.id}
                        className="hover:bg-ark-bg-elevated transition-colors group"
                      >
                        <td className="px-4 py-3">
                          <StatusBadge status={invoice.status} />
                        </td>
                        <td className="px-4 py-3 text-sm text-ark-text-primary font-medium">
                          {invoice.vendor_name ?? 'Unknown'}
                        </td>
                        <td className="px-4 py-3 text-sm text-ark-text-muted font-mono">
                          {invoice.invoice_number ?? '—'}
                        </td>
                        <td className="px-4 py-3 text-sm text-right tabular-nums font-medium text-ark-text-primary">
                          {formatCurrency(Number(invoice.total_amount), invoice.currency)}
                        </td>
                        <td className="px-4 py-3 text-sm text-ark-text-muted">
                          {formatDate(invoice.due_date)}
                        </td>
                        <td className="px-4 py-3">
                          <AgingLabel due_date={invoice.due_date} status={invoice.status} />
                          {daysOverdue > 0 && !['PAID', 'ARCHIVED'].includes(invoice.status) && (
                            <span className="text-xs text-ark-danger ml-1">{daysOverdue}d</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link
                              href={`/app/invoices/${invoice.id}`}
                              className="text-xs text-ark-primary hover:underline"
                            >
                              View
                            </Link>
                            {['OVERDUE', 'CHASED'].includes(invoice.status) && (
                              <Link
                                href={`/app/invoices/${invoice.id}/chase`}
                                className="text-xs text-ark-text-muted hover:text-ark-primary"
                              >
                                Chase
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            </div>

            {/* Pagination */}
            {data.pages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-ark-border">
                <span className="text-xs text-ark-text-faint">
                  Page {data.page} of {data.pages} · {data.total} invoices
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 text-xs border border-ark-border rounded text-ark-text-muted hover:text-ark-text-primary disabled:opacity-40 transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                    disabled={page === data.pages}
                    className="px-3 py-1 text-xs border border-ark-border rounded text-ark-text-muted hover:text-ark-text-primary disabled:opacity-40 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
