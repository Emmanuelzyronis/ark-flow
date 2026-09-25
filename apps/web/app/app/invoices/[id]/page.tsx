'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { invoicesApi } from '@/lib/api';
import { formatCurrency, formatDate, getDaysOverdue, relativeTime } from '@/lib/utils';
import { StatusBadge, ConfidenceBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';

interface LineItem {
  id: string;
  description: string;
  quantity?: number;
  unit_price?: number;
  total: number;
  confidence_score?: number;
}

interface StateLogItem {
  id: string;
  from_state?: string;
  to_state: string;
  trigger_source: string;
  user_name?: string;
  created_at: string;
  metadata?: Record<string, unknown>;
}

interface Invoice {
  id: string;
  vendor_name?: string;
  vendor_email?: string;
  invoice_number?: string;
  invoice_date?: string;
  due_date?: string;
  total_amount: string;
  currency: string;
  po_number?: string;
  status: string;
  extraction_confidence?: number;
  created_at: string;
  line_items?: LineItem[];
  state_log?: StateLogItem[];
}

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [editedFields, setEditedFields] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    invoicesApi.get(id)
      .then((res) => {
        const inv = res as Invoice;
        setInvoice(inv);
        setEditedFields({
          vendor_name: inv.vendor_name ?? '',
          invoice_number: inv.invoice_number ?? '',
          invoice_date: inv.invoice_date ?? '',
          due_date: inv.due_date ?? '',
          total_amount: inv.total_amount ?? '',
          currency: inv.currency ?? 'USD',
          po_number: inv.po_number ?? '',
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  async function handleConfirm() {
    setConfirming(true);
    try {
      await invoicesApi.confirm(id, {
        ...editedFields,
        total_amount: parseFloat(editedFields.total_amount),
        line_items: invoice?.line_items,
      });
      setSaved(true);
      const updated = await invoicesApi.get(id) as Invoice;
      setInvoice(updated);
    } catch (err) {
      console.error(err);
    } finally {
      setConfirming(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="h-8 w-48 shimmer rounded mb-6" />
        <div className="grid grid-cols-2 gap-6">
          <div className="h-96 shimmer rounded-xl" />
          <div className="h-96 shimmer rounded-xl" />
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="p-8 text-center">
        <p className="text-ark-text-muted">Invoice not found</p>
        <Link href="/app/invoices" className="text-ark-primary text-sm mt-2 inline-block hover:underline">
          Back to invoices
        </Link>
      </div>
    );
  }

  const daysOverdue = getDaysOverdue(invoice.due_date);
  const isOverdue = daysOverdue > 0 && !['PAID', 'ARCHIVED'].includes(invoice.status);
  const needsConfirm = ['EXTRACTED', 'RECEIVED'].includes(invoice.status);

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <Link href="/app/invoices" className="text-ark-text-faint text-xs hover:text-ark-text-muted transition-colors mb-2 inline-block">
            ← Invoices
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-ark-text-primary">
              {invoice.vendor_name ?? 'Invoice'} {invoice.invoice_number ? `#${invoice.invoice_number}` : ''}
            </h1>
            <StatusBadge status={invoice.status} size="md" />
          </div>
          <p className="text-ark-text-muted text-sm mt-1">
            {formatCurrency(Number(invoice.total_amount), invoice.currency)} · Created {formatDate(invoice.created_at)}
          </p>
        </div>
        {isOverdue && (
          <Link
            href={`/app/invoices/${id}/chase`}
            className="bg-ark-danger/10 border border-ark-danger/30 text-ark-danger hover:bg-ark-danger/20 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            Chase Payment ({daysOverdue}d overdue)
          </Link>
        )}
      </div>

      {/* Chase sticky banner */}
      {isOverdue && (
        <div className="bg-ark-danger-bg border border-ark-danger/30 rounded-lg p-3 mb-6 flex items-center justify-between">
          <p className="text-sm text-ark-danger font-medium">
            This invoice is {daysOverdue} days overdue — {formatCurrency(Number(invoice.total_amount), invoice.currency)}
          </p>
          <Link href={`/app/invoices/${id}/chase`} className="text-xs text-ark-danger font-bold hover:underline">
            Send chase email →
          </Link>
        </div>
      )}

      {saved && (
        <div className="bg-ark-success-bg border border-ark-success/30 rounded-lg p-3 mb-6">
          <p className="text-sm text-ark-success font-medium">Invoice confirmed and saved as PENDING</p>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Extraction Review Form */}
        <div className="bg-ark-bg-card border border-ark-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-ark-text-primary">Invoice Details</h2>
            {invoice.extraction_confidence != null && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-ark-text-faint">AI Confidence:</span>
                <ConfidenceBadge score={invoice.extraction_confidence} />
              </div>
            )}
          </div>

          <div className="space-y-4">
            {[
              { key: 'vendor_name', label: 'Vendor Name' },
              { key: 'invoice_number', label: 'Invoice Number' },
              { key: 'invoice_date', label: 'Invoice Date', type: 'date' },
              { key: 'due_date', label: 'Due Date', type: 'date' },
              { key: 'po_number', label: 'PO Number' },
              { key: 'currency', label: 'Currency' },
            ].map(({ key, label, type }) => (
              <div key={key} className="space-y-1">
                <label className="block text-xs font-semibold uppercase tracking-wider text-ark-text-muted">
                  {label}
                </label>
                <input
                  type={type ?? 'text'}
                  value={editedFields[key] ?? ''}
                  onChange={(e) => setEditedFields((prev) => ({ ...prev, [key]: e.target.value }))}
                  disabled={!needsConfirm && !saved}
                  className="w-full bg-ark-bg-elevated border border-ark-border rounded px-3 py-2 text-ark-text-primary text-sm focus:outline-none focus:border-ark-primary focus:ring-1 focus:ring-ark-primary transition-colors disabled:opacity-60"
                />
              </div>
            ))}

            <div className="space-y-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-ark-text-muted">
                Total Amount
              </label>
              <input
                type="number"
                step="0.01"
                value={editedFields.total_amount ?? ''}
                onChange={(e) => setEditedFields((prev) => ({ ...prev, total_amount: e.target.value }))}
                disabled={!needsConfirm && !saved}
                className="w-full bg-ark-bg-elevated border border-ark-border rounded px-3 py-2 text-ark-text-primary text-sm tabular-nums focus:outline-none focus:border-ark-primary focus:ring-1 focus:ring-ark-primary transition-colors disabled:opacity-60"
              />
            </div>

            {needsConfirm && (
              <Button
                onClick={handleConfirm}
                loading={confirming}
                disabled={!editedFields.vendor_name || !editedFields.total_amount}
                className="w-full mt-2"
                size="lg"
              >
                Confirm Invoice
              </Button>
            )}

            {invoice.status === 'PENDING' && !saved && (
              <div className="mt-2 space-y-2">
                <Button
                  variant="outline"
                  onClick={() => router.push(`/app/reconcile`)}
                  className="w-full"
                >
                  Reconcile Payment
                </Button>
                <Button
                  variant="ghost"
                  onClick={async () => {
                    await invoicesApi.setStatus(id, 'OVERDUE', 'Manual override');
                    const updated = await invoicesApi.get(id) as Invoice;
                    setInvoice(updated);
                  }}
                  className="w-full text-xs text-ark-text-faint"
                >
                  Mark Overdue
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Right column: line items + audit trail */}
        <div className="space-y-6">
          {/* Line items */}
          {invoice.line_items && invoice.line_items.length > 0 && (
            <div className="bg-ark-bg-card border border-ark-border rounded-xl p-5">
              <h3 className="text-sm font-semibold text-ark-text-primary mb-4">Line Items</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-ark-border">
                      <th className="pb-2 text-left text-xs text-ark-text-faint font-semibold uppercase tracking-wider">Description</th>
                      <th className="pb-2 text-right text-xs text-ark-text-faint font-semibold uppercase tracking-wider">Qty</th>
                      <th className="pb-2 text-right text-xs text-ark-text-faint font-semibold uppercase tracking-wider">Unit</th>
                      <th className="pb-2 text-right text-xs text-ark-text-faint font-semibold uppercase tracking-wider">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ark-border">
                    {invoice.line_items.map((item) => (
                      <tr key={item.id} className="py-2">
                        <td className="py-2 text-ark-text-secondary pr-3">{item.description}</td>
                        <td className="py-2 text-right tabular-nums text-ark-text-muted">{item.quantity ?? '—'}</td>
                        <td className="py-2 text-right tabular-nums text-ark-text-muted">
                          {item.unit_price ? formatCurrency(item.unit_price, invoice.currency) : '—'}
                        </td>
                        <td className="py-2 text-right tabular-nums text-ark-text-primary font-medium">
                          {formatCurrency(item.total, invoice.currency)}
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t border-ark-border-bright">
                      <td colSpan={3} className="py-2 text-right text-xs font-semibold uppercase tracking-wider text-ark-text-muted">Total</td>
                      <td className="py-2 text-right tabular-nums font-bold text-ark-primary">
                        {formatCurrency(Number(invoice.total_amount), invoice.currency)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Audit trail */}
          {invoice.state_log && invoice.state_log.length > 0 && (
            <div className="bg-ark-bg-card border border-ark-border rounded-xl p-5">
              <h3 className="text-sm font-semibold text-ark-text-primary mb-4">Audit Trail</h3>
              <div className="space-y-3">
                {invoice.state_log.map((entry, idx) => (
                  <div key={entry.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0 ${
                        entry.to_state === 'PAID' ? 'bg-ark-success' :
                        entry.to_state === 'OVERDUE' ? 'bg-ark-danger' :
                        entry.to_state === 'PENDING' ? 'bg-yellow-500' :
                        'bg-ark-primary'
                      }`} />
                      {idx < (invoice.state_log?.length ?? 0) - 1 && (
                        <div className="flex-1 w-px bg-ark-border mt-1" />
                      )}
                    </div>
                    <div className="pb-3 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={entry.to_state} size="sm" />
                        <span className="text-xs text-ark-text-faint">via {entry.trigger_source}</span>
                      </div>
                      <div className="text-xs text-ark-text-faint mt-0.5" title={new Date(entry.created_at).toLocaleString()}>
                        {relativeTime(entry.created_at)}
                        {entry.user_name && <span className="ml-1">· {entry.user_name}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
