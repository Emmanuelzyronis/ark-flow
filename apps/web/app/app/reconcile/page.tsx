'use client';

import { useEffect, useState } from 'react';
import { reconcileApi } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';

interface OpenInvoice {
  id: string;
  vendor_name?: string;
  invoice_number?: string;
  total_amount: string;
  currency: string;
  due_date?: string;
  status: string;
}

interface InvariantResult {
  pass: boolean;
  reason: string;
}

export default function ReconcilePage() {
  const [openInvoices, setOpenInvoices] = useState<OpenInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<OpenInvoice | null>(null);
  const [manualPayment, setManualPayment] = useState({
    amount: '',
    currency: 'USD',
    payment_date: new Date().toISOString().split('T')[0],
    reference: '',
  });
  const [reconciling, setReconciling] = useState(false);
  const [result, setResult] = useState<{
    success?: boolean;
    error?: string;
    invariants?: Record<string, InvariantResult>;
    failed_invariants?: Array<{ invariant: string; reason: string }>;
  } | null>(null);

  useEffect(() => {
    reconcileApi.unmatched()
      .then((res) => {
        const data = res as { open_invoices: OpenInvoice[] };
        setOpenInvoices(data.open_invoices ?? []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function handleReconcile() {
    if (!selectedInvoice || !manualPayment.amount) return;
    setReconciling(true);
    setResult(null);
    try {
      const res = await reconcileApi.manual({
        invoice_id: selectedInvoice.id,
        amount: parseFloat(manualPayment.amount),
        currency: manualPayment.currency,
        payment_date: manualPayment.payment_date,
        reference: manualPayment.reference || undefined,
      }) as { success: boolean; invariants: Record<string, InvariantResult> };
      setResult({ success: true, invariants: res.invariants });
      // Remove the matched invoice
      setOpenInvoices((prev) => prev.filter((i) => i.id !== selectedInvoice.id));
      setSelectedInvoice(null);
      setManualPayment({ amount: '', currency: 'USD', payment_date: new Date().toISOString().split('T')[0], reference: '' });
    } catch (err: unknown) {
      const e = err as { message?: string; failed_invariants?: Array<{ invariant: string; reason: string }> };
      setResult({ error: e.message, failed_invariants: e.failed_invariants });
    } finally {
      setReconciling(false);
    }
  }

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ark-text-primary">Reconcile Payments</h1>
        <p className="text-ark-text-muted text-sm mt-1">
          Match payments to open invoices using the 12-invariant engine
        </p>
      </div>

      {result?.success && (
        <div className="bg-ark-success-bg border border-ark-success/30 rounded-lg p-4 mb-6">
          <p className="text-ark-success font-medium">Payment reconciled successfully. Invoice marked PAID.</p>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Open invoices */}
        <div className="bg-ark-bg-card border border-ark-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-ark-border">
            <h2 className="text-sm font-semibold text-ark-text-primary">Open Invoices</h2>
            <p className="text-xs text-ark-text-faint mt-0.5">{openInvoices.length} awaiting payment</p>
          </div>
          {loading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-14 shimmer rounded" />)}
            </div>
          ) : openInvoices.length === 0 ? (
            <div className="p-10 text-center">
              <div className="text-3xl mb-2">✅</div>
              <p className="font-semibold text-ark-text-primary text-sm">All transactions reconciled</p>
            </div>
          ) : (
            <div className="divide-y divide-ark-border max-h-96 overflow-y-auto">
              {openInvoices.map((inv) => (
                <button
                  key={inv.id}
                  onClick={() => {
                    setSelectedInvoice(inv);
                    setManualPayment((prev) => ({
                      ...prev,
                      amount: inv.total_amount,
                      currency: inv.currency,
                    }));
                    setResult(null);
                  }}
                  className={`w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-ark-bg-elevated transition-colors ${
                    selectedInvoice?.id === inv.id ? 'bg-ark-primary-muted border-l-2 border-ark-primary' : ''
                  }`}
                >
                  <StatusBadge status={inv.status} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-ark-text-primary truncate">
                      {inv.vendor_name ?? 'Unknown'} {inv.invoice_number ? `#${inv.invoice_number}` : ''}
                    </div>
                    <div className="text-xs text-ark-text-faint">
                      Due {formatDate(inv.due_date)}
                    </div>
                  </div>
                  <div className="text-sm font-bold tabular-nums text-ark-text-primary flex-shrink-0">
                    {formatCurrency(Number(inv.total_amount), inv.currency)}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Manual payment entry */}
        <div className="bg-ark-bg-card border border-ark-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-ark-text-primary mb-4">Record Payment</h2>

          {selectedInvoice ? (
            <div className="mb-4 p-3 bg-ark-primary-muted border border-ark-primary/30 rounded-lg">
              <div className="text-xs text-ark-text-faint mb-1">Matching to invoice</div>
              <div className="text-sm font-medium text-ark-text-primary">
                {selectedInvoice.vendor_name} {selectedInvoice.invoice_number ? `#${selectedInvoice.invoice_number}` : ''}
              </div>
              <div className="text-xs text-ark-text-muted tabular-nums">
                {formatCurrency(Number(selectedInvoice.total_amount), selectedInvoice.currency)}
              </div>
            </div>
          ) : (
            <div className="mb-4 p-3 bg-ark-bg-elevated border border-ark-border rounded-lg text-xs text-ark-text-faint text-center">
              Select an invoice from the left to match
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-ark-text-muted">Amount</label>
              <input
                type="number"
                step="0.01"
                value={manualPayment.amount}
                onChange={(e) => setManualPayment((prev) => ({ ...prev, amount: e.target.value }))}
                className="w-full bg-ark-bg-elevated border border-ark-border rounded px-3 py-2 text-ark-text-primary text-sm tabular-nums focus:outline-none focus:border-ark-primary focus:ring-1 focus:ring-ark-primary transition-colors"
                placeholder="0.00"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-semibold uppercase tracking-wider text-ark-text-muted">Currency</label>
                <input
                  type="text"
                  maxLength={3}
                  value={manualPayment.currency}
                  onChange={(e) => setManualPayment((prev) => ({ ...prev, currency: e.target.value.toUpperCase() }))}
                  className="w-full bg-ark-bg-elevated border border-ark-border rounded px-3 py-2 text-ark-text-primary text-sm focus:outline-none focus:border-ark-primary focus:ring-1 focus:ring-ark-primary transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-semibold uppercase tracking-wider text-ark-text-muted">Date</label>
                <input
                  type="date"
                  value={manualPayment.payment_date}
                  onChange={(e) => setManualPayment((prev) => ({ ...prev, payment_date: e.target.value }))}
                  className="w-full bg-ark-bg-elevated border border-ark-border rounded px-3 py-2 text-ark-text-primary text-sm focus:outline-none focus:border-ark-primary focus:ring-1 focus:ring-ark-primary transition-colors"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-ark-text-muted">Reference (optional)</label>
              <input
                type="text"
                value={manualPayment.reference}
                onChange={(e) => setManualPayment((prev) => ({ ...prev, reference: e.target.value }))}
                className="w-full bg-ark-bg-elevated border border-ark-border rounded px-3 py-2 text-ark-text-primary text-sm focus:outline-none focus:border-ark-primary focus:ring-1 focus:ring-ark-primary transition-colors"
                placeholder="Bank reference, check number…"
              />
            </div>

            <Button
              onClick={handleReconcile}
              loading={reconciling}
              disabled={!manualPayment.amount || !manualPayment.payment_date}
              className="w-full"
              size="lg"
            >
              Run 12-Invariant Check &amp; Reconcile
            </Button>
          </div>

          {/* Invariant results */}
          {result && (
            <div className={`mt-4 border rounded-lg p-4 ${result.success ? 'bg-ark-success-bg border-ark-success/30' : 'bg-ark-danger-bg border-ark-danger/30'}`}>
              {result.success && result.invariants ? (
                <>
                  <p className="text-sm font-semibold text-ark-success mb-3">All 12 invariants passed</p>
                  <div className="space-y-1.5">
                    {Object.entries(result.invariants).map(([key, inv]) => (
                      <div key={key} className="flex items-start gap-2 text-xs">
                        <span className={inv.pass ? 'text-ark-success' : 'text-ark-danger'}>
                          {inv.pass ? '✓' : '✕'}
                        </span>
                        <span className="text-ark-text-muted">{inv.reason}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold text-ark-danger mb-2">Reconciliation failed</p>
                  {result.failed_invariants?.map((f) => (
                    <div key={f.invariant} className="text-xs text-ark-danger mb-1">
                      ✕ {f.reason}
                    </div>
                  ))}
                  {result.error && <p className="text-xs text-ark-danger">{result.error}</p>}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
