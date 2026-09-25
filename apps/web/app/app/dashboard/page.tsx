'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { dashboardApi } from '@/lib/api';
import { formatCurrency, relativeTime } from '@/lib/utils';
import { KPICard } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';

interface Summary {
  total_outstanding: string;
  total_overdue: string;
  collected_this_month: string;
  invoices_this_month: string;
  pending_count: string;
  overdue_count: string;
}

interface AgingData {
  total_0_30: string;
  count_0_30: string;
  total_31_60: string;
  count_31_60: string;
  total_61_90: string;
  count_61_90: string;
  total_over_90: string;
  count_over_90: string;
}

interface ActivityItem {
  id: string;
  invoice_id: string;
  from_state?: string;
  to_state: string;
  invoice_number?: string;
  total_amount?: string;
  currency?: string;
  vendor_name?: string;
  created_at: string;
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [aging, setAging] = useState<AgingData | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      dashboardApi.summary(),
      dashboardApi.aging(),
      dashboardApi.activity(),
    ])
      .then(([s, a, act]) => {
        setSummary(s as Summary);
        setAging(a as AgingData);
        setActivity((act as { activity: ActivityItem[] }).activity ?? []);
      })
      .catch((err) => {
        console.error(err);
        setError('Unable to load dashboard data. Please refresh the page.');
      })
      .finally(() => setLoading(false));
  }, []);

  const totalAging =
    Number(aging?.total_0_30 ?? 0) +
    Number(aging?.total_31_60 ?? 0) +
    Number(aging?.total_61_90 ?? 0) +
    Number(aging?.total_over_90 ?? 0);

  const agingBuckets = aging
    ? [
        { label: '0–30d', amount: Number(aging.total_0_30 ?? 0), count: Number(aging.count_0_30 ?? 0), color: '#D97706' },
        { label: '31–60d', amount: Number(aging.total_31_60 ?? 0), count: Number(aging.count_31_60 ?? 0), color: '#F97316' },
        { label: '61–90d', amount: Number(aging.total_61_90 ?? 0), count: Number(aging.count_61_90 ?? 0), color: '#EA580C' },
        { label: '90d+', amount: Number(aging.total_over_90 ?? 0), count: Number(aging.count_over_90 ?? 0), color: '#DC2626' },
      ]
    : [];

  return (
    <div className="p-4 md:p-8 max-w-6xl">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl font-bold text-ark-text-primary">Dashboard</h1>
        <p className="text-ark-text-muted text-sm mt-1">Your AP/AR overview at a glance</p>
      </div>

      {error && (
        <div className="bg-ark-danger-bg border border-ark-danger/30 rounded-lg p-4 mb-6 flex items-start gap-3">
          <span className="text-ark-danger flex-shrink-0 mt-0.5" aria-hidden="true">⚠</span>
          <div>
            <p className="text-sm text-ark-danger font-medium">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-xs text-ark-danger underline mt-1 hover:no-underline"
            >
              Refresh page
            </button>
          </div>
        </div>
      )}

      {/* KPI Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KPICard
          label="Total Outstanding"
          value={summary ? formatCurrency(Number(summary.total_outstanding ?? 0)) : '…'}
          variant="default"
          loading={loading}
        />
        <KPICard
          label="Total Overdue"
          value={summary ? formatCurrency(Number(summary.total_overdue ?? 0)) : '…'}
          variant={Number(summary?.total_overdue ?? 0) > 0 ? 'danger' : 'default'}
          subtitle={summary ? `${summary.overdue_count} invoices` : undefined}
          loading={loading}
        />
        <KPICard
          label="Collected This Month"
          value={summary ? formatCurrency(Number(summary.collected_this_month ?? 0)) : '…'}
          variant="success"
          loading={loading}
        />
        <KPICard
          label="Invoices This Month"
          value={summary ? String(summary.invoices_this_month ?? 0) : '…'}
          subtitle={summary ? `${summary.pending_count} pending` : undefined}
          loading={loading}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Aging chart */}
        <div className="lg:col-span-2 bg-ark-bg-card border border-ark-border rounded-xl p-6">
          <h2 className="text-sm font-semibold text-ark-text-primary mb-6">Invoice Aging</h2>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 shimmer rounded" />
              ))}
            </div>
          ) : totalAging === 0 ? (
            <div className="text-center py-8 text-ark-text-faint text-sm">
              No outstanding invoices
            </div>
          ) : (
            <div className="space-y-3">
              {agingBuckets.map((bucket) => {
                const width = totalAging > 0 ? (bucket.amount / totalAging) * 100 : 0;
                return (
                  <Link key={bucket.label} href={`/app/invoices?aging=${bucket.label}`} className="block group">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-ark-text-secondary font-medium">{bucket.label}</span>
                      <span className="tabular-nums text-ark-text-muted">{formatCurrency(bucket.amount)} · {bucket.count}</span>
                    </div>
                    <div className="h-8 bg-ark-bg-elevated rounded overflow-hidden">
                      <div
                        className="h-full rounded transition-all duration-500 group-hover:opacity-90"
                        style={{ width: `${Math.max(width, bucket.amount > 0 ? 2 : 0)}%`, backgroundColor: bucket.color }}
                      />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Activity feed */}
        <div className="bg-ark-bg-card border border-ark-border rounded-xl p-6">
          <h2 className="text-sm font-semibold text-ark-text-primary mb-4">Recent Activity</h2>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-10 shimmer rounded" />)}
            </div>
          ) : activity.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-ark-text-faint text-sm">No activity yet</p>
              <Link href="/app/invoices/upload" className="text-ark-primary text-sm hover:underline mt-2 inline-block">
                Upload your first invoice
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {activity.slice(0, 8).map((item) => (
                <Link
                  key={item.id}
                  href={`/app/invoices/${item.invoice_id}`}
                  className="flex items-start gap-2.5 py-2 rounded hover:bg-ark-bg-elevated px-2 -mx-2 transition-colors group"
                >
                  <StatusBadge status={item.to_state} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-ark-text-secondary truncate">
                      {item.vendor_name ?? 'Unknown vendor'}
                      {item.invoice_number && <span className="text-ark-text-faint ml-1">#{item.invoice_number}</span>}
                    </div>
                    <div className="text-xs text-ark-text-faint">{relativeTime(item.created_at)}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Empty state */}
      {!loading && Number(summary?.invoices_this_month ?? 0) === 0 && (
        <div className="mt-8 border border-dashed border-ark-border rounded-xl p-12 text-center">
          <div className="text-4xl mb-4">📥</div>
          <h3 className="text-lg font-semibold text-ark-text-primary mb-2">No invoices yet</h3>
          <p className="text-ark-text-muted text-sm mb-6 max-w-sm mx-auto">
            Upload your first invoice and Claude AI will extract every field automatically.
          </p>
          <Link
            href="/app/invoices/upload"
            className="inline-flex items-center gap-2 bg-ark-primary hover:bg-ark-primary-hover text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-glow-primary-sm"
          >
            Upload Your First Invoice
          </Link>
        </div>
      )}
    </div>
  );
}
