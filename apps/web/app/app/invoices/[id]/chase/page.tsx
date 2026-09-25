'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { invoicesApi, chaseApi } from '@/lib/api';
import { formatCurrency, getDaysOverdue } from '@/lib/utils';
import { Button } from '@/components/ui/button';

type Tone = 'polite' | 'firm' | 'final';

interface Invoice {
  id: string;
  vendor_name?: string;
  vendor_email?: string;
  invoice_number?: string;
  due_date?: string;
  total_amount: string;
  currency: string;
  status: string;
}

export default function ChasePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [tone, setTone] = useState<Tone>('polite');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [drafting, setDrafting] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    invoicesApi.get(id).then((res) => {
      const inv = res as Invoice;
      setInvoice(inv);
      setRecipientEmail(inv.vendor_email ?? '');
    }).catch(console.error);
  }, [id]);

  async function draftEmail(selectedTone: Tone) {
    setDrafting(true);
    try {
      const res = await chaseApi.draft(id, selectedTone) as {
        subject: string;
        body: string;
        recipient_email?: string;
      };
      setSubject(res.subject);
      setBody(res.body);
      if (res.recipient_email && !recipientEmail) {
        setRecipientEmail(res.recipient_email);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDrafting(false);
    }
  }

  async function handleToneChange(newTone: Tone) {
    setTone(newTone);
    await draftEmail(newTone);
  }

  useEffect(() => {
    if (invoice) {
      draftEmail('polite');
    }
  }, [invoice]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSend() {
    if (!invoice) return;
    setSending(true);
    try {
      await chaseApi.send({
        invoice_id: id,
        tone,
        subject,
        body,
        recipient_email: recipientEmail,
        days_overdue: getDaysOverdue(invoice.due_date),
      });
      setSent(true);
      setConfirmOpen(false);
      setTimeout(() => router.push(`/app/invoices/${id}`), 1500);
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  }

  const daysOverdue = getDaysOverdue(invoice?.due_date);

  return (
    <div className="p-4 md:p-8 max-w-4xl">
      <div className="mb-6">
        <Link href={`/app/invoices/${id}`} className="text-ark-text-faint text-xs hover:text-ark-text-muted mb-2 inline-block">
          ← Invoice
        </Link>
        <h1 className="text-2xl font-bold text-ark-text-primary">Chase Payment</h1>
        {invoice && (
          <p className="text-ark-text-muted text-sm mt-1">
            {invoice.vendor_name} · {formatCurrency(Number(invoice.total_amount), invoice.currency)} · {daysOverdue}d overdue
          </p>
        )}
      </div>

      {sent && (
        <div className="bg-ark-success-bg border border-ark-success/30 rounded-lg p-4 mb-6">
          <p className="text-ark-success font-medium">Chase email saved. Redirecting…</p>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          {/* Tone selector */}
          <div className="bg-ark-bg-card border border-ark-border rounded-xl p-5">
            <div className="text-xs font-semibold uppercase tracking-wider text-ark-text-muted mb-3">Tone</div>
            <div className="flex gap-2">
              {(['polite', 'firm', 'final'] as Tone[]).map((t) => (
                <button
                  key={t}
                  onClick={() => handleToneChange(t)}
                  disabled={drafting}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors capitalize ${
                    tone === t
                      ? t === 'polite' ? 'bg-ark-success-bg text-ark-success border border-ark-success/30' :
                        t === 'firm' ? 'bg-ark-warning-bg text-yellow-400 border border-yellow-600/30' :
                        'bg-ark-danger-bg text-ark-danger border border-ark-danger/30'
                      : 'bg-ark-bg-elevated text-ark-text-muted border border-ark-border hover:border-ark-border-bright'
                  }`}
                >
                  {t === 'final' ? 'Final Notice' : t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Email composer */}
          <div className="bg-ark-bg-card border border-ark-border rounded-xl p-5 space-y-4">
            <div className="space-y-1">
              <label htmlFor="chase-to" className="block text-xs font-semibold uppercase tracking-wider text-ark-text-muted">
                To
              </label>
              <input
                id="chase-to"
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="vendor@example.com"
                className="w-full bg-ark-bg-elevated border border-ark-border rounded px-3 py-2 text-ark-text-primary text-sm focus:outline-none focus:border-ark-primary focus:ring-1 focus:ring-ark-primary transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="chase-subject" className="block text-xs font-semibold uppercase tracking-wider text-ark-text-muted">
                Subject
              </label>
              {drafting ? (
                <div className="h-9 shimmer rounded" aria-busy="true" aria-label="Drafting subject…" />
              ) : (
                <input
                  id="chase-subject"
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-ark-bg-elevated border border-ark-border rounded px-3 py-2 text-ark-text-primary text-sm focus:outline-none focus:border-ark-primary focus:ring-1 focus:ring-ark-primary transition-colors"
                />
              )}
            </div>

            <div className="space-y-1">
              <label htmlFor="chase-body" className="block text-xs font-semibold uppercase tracking-wider text-ark-text-muted">
                Message
              </label>
              {drafting ? (
                <div className="h-48 shimmer rounded" aria-busy="true" aria-label="Drafting message…" />
              ) : (
                <textarea
                  id="chase-body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={10}
                  className="w-full bg-ark-bg-elevated border border-ark-border rounded px-3 py-2 text-ark-text-primary text-sm resize-y focus:outline-none focus:border-ark-primary focus:ring-1 focus:ring-ark-primary transition-colors"
                />
              )}
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setConfirmOpen(true)}
                disabled={!subject || !body || !recipientEmail || drafting}
                size="lg"
                className="flex-1"
              >
                {sent ? '✓ Sent' : 'Send Chase Email'}
              </Button>
              <Button
                variant="secondary"
                onClick={() => draftEmail(tone)}
                loading={drafting}
              >
                Regenerate
              </Button>
            </div>
          </div>
        </div>

        {/* Invoice summary sidebar */}
        <div>
          <div className="bg-ark-bg-card border border-ark-border rounded-xl p-5 sticky top-6">
            <h3 className="text-sm font-semibold text-ark-text-primary mb-4">Invoice Summary</h3>
            {invoice && (
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-ark-text-faint uppercase tracking-wider mb-1">Vendor</div>
                  <div className="text-sm text-ark-text-primary font-medium">{invoice.vendor_name ?? '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-ark-text-faint uppercase tracking-wider mb-1">Invoice #</div>
                  <div className="text-sm text-ark-text-muted font-mono">{invoice.invoice_number ?? '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-ark-text-faint uppercase tracking-wider mb-1">Amount Due</div>
                  <div className="text-xl font-bold tabular-nums text-ark-primary">
                    {formatCurrency(Number(invoice.total_amount), invoice.currency)}
                  </div>
                </div>
                <div className="bg-ark-danger-bg border border-ark-danger/30 rounded-lg px-3 py-2">
                  <div className="text-xs text-ark-danger font-semibold">{daysOverdue} days overdue</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirm modal */}
      {confirmOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-ark-bg-card border border-ark-border rounded-xl p-6 max-w-sm w-full shadow-glow-primary-sm">
            <h3 className="font-semibold text-ark-text-primary mb-2">Send chase email?</h3>
            <p className="text-sm text-ark-text-muted mb-4">
              Sending to <span className="text-ark-text-primary font-medium">{recipientEmail}</span>
            </p>
            <div className="flex gap-3">
              <Button onClick={handleSend} loading={sending} className="flex-1">
                Confirm Send
              </Button>
              <Button variant="secondary" onClick={() => setConfirmOpen(false)} disabled={sending}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
