'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { vendorsApi } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/status-badge';

interface Vendor {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  payment_method?: string;
  preferred_currency: string;
  avg_days_to_pay?: number;
  total_invoiced: string;
  invoice_count: number;
}

interface Invoice {
  id: string;
  invoice_number?: string;
  total_amount: string;
  currency: string;
  status: string;
  due_date?: string;
  created_at: string;
}

export default function VendorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([vendorsApi.get(id), vendorsApi.invoices(id)])
      .then(([v, inv]) => {
        setVendor(v as Vendor);
        setInvoices((inv as { invoices: Invoice[] }).invoices ?? []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-8"><div className="h-48 shimmer rounded-xl" /></div>;
  if (!vendor) return <div className="p-8 text-ark-text-muted">Vendor not found</div>;

  return (
    <div className="p-8 max-w-4xl">
      <Link href="/app/vendors" className="text-ark-text-faint text-xs hover:text-ark-text-muted mb-4 inline-block">
        ← Vendors
      </Link>

      <div className="flex items-start gap-4 mb-8">
        <div className="w-12 h-12 bg-ark-primary-muted border border-ark-primary/20 rounded-xl flex items-center justify-center text-ark-primary font-bold text-lg">
          {vendor.name[0]?.toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-ark-text-primary">{vendor.name}</h1>
          {vendor.email && <p className="text-ark-text-muted text-sm">{vendor.email}</p>}
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <div className="bg-ark-bg-card border border-ark-border rounded-xl p-4">
          <div className="text-xs text-ark-text-faint uppercase tracking-wider mb-1">Total Invoiced</div>
          <div className="text-lg font-bold tabular-nums text-ark-primary">{formatCurrency(Number(vendor.total_invoiced), vendor.preferred_currency)}</div>
        </div>
        <div className="bg-ark-bg-card border border-ark-border rounded-xl p-4">
          <div className="text-xs text-ark-text-faint uppercase tracking-wider mb-1">Invoices</div>
          <div className="text-lg font-bold text-ark-text-primary">{vendor.invoice_count}</div>
        </div>
        <div className="bg-ark-bg-card border border-ark-border rounded-xl p-4">
          <div className="text-xs text-ark-text-faint uppercase tracking-wider mb-1">Avg Days to Pay</div>
          <div className={`text-lg font-bold tabular-nums ${
            !vendor.avg_days_to_pay ? 'text-ark-text-faint' :
            vendor.avg_days_to_pay <= 30 ? 'text-ark-success' :
            vendor.avg_days_to_pay <= 60 ? 'text-yellow-400' : 'text-ark-danger'
          }`}>
            {vendor.avg_days_to_pay ? `${Math.round(vendor.avg_days_to_pay)}d` : '—'}
          </div>
        </div>
        <div className="bg-ark-bg-card border border-ark-border rounded-xl p-4">
          <div className="text-xs text-ark-text-faint uppercase tracking-wider mb-1">Currency</div>
          <div className="text-lg font-bold text-ark-text-primary">{vendor.preferred_currency}</div>
        </div>
      </div>

      {/* Invoice history */}
      <div className="bg-ark-bg-card border border-ark-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-ark-border">
          <h2 className="text-sm font-semibold text-ark-text-primary">Invoice History</h2>
        </div>
        {invoices.length === 0 ? (
          <div className="p-8 text-center text-ark-text-faint text-sm">No invoices yet</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-ark-border">
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-ark-text-faint">Status</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-ark-text-faint">Invoice #</th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-ark-text-faint">Amount</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-ark-text-faint">Due</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-ark-border">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-ark-bg-elevated transition-colors">
                  <td className="px-5 py-3"><StatusBadge status={inv.status} /></td>
                  <td className="px-5 py-3 text-sm text-ark-text-muted font-mono">{inv.invoice_number ?? '—'}</td>
                  <td className="px-5 py-3 text-sm text-right tabular-nums text-ark-text-primary font-medium">
                    {formatCurrency(Number(inv.total_amount), inv.currency)}
                  </td>
                  <td className="px-5 py-3 text-sm text-ark-text-muted">{formatDate(inv.due_date)}</td>
                  <td className="px-5 py-3">
                    <Link href={`/app/invoices/${inv.id}`} className="text-xs text-ark-primary hover:underline">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
