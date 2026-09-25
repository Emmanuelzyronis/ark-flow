'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { vendorsApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

interface Vendor {
  id: string;
  name: string;
  email?: string;
  avg_days_to_pay?: number;
  invoice_count: number;
  total_invoiced: string;
  outstanding_total?: string;
  preferred_currency: string;
  last_invoice_date?: string;
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    vendorsApi.list()
      .then((res) => {
        const data = res as { vendors: Vendor[] };
        setVendors(data.vendors ?? []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = vendors.filter((v) =>
    v.name.toLowerCase().includes(search.toLowerCase()) ||
    (v.email ?? '').toLowerCase().includes(search.toLowerCase())
  );

  function avgDaysClass(days?: number) {
    if (!days) return 'text-ark-text-faint';
    if (days <= 30) return 'text-ark-success';
    if (days <= 60) return 'text-yellow-400';
    return 'text-ark-danger';
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ark-text-primary">Vendors</h1>
          <p className="text-ark-text-muted text-sm mt-1">
            {vendors.length} vendor{vendors.length !== 1 ? 's' : ''} · auto-discovered from invoices
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-5">
        <label htmlFor="vendor-search" className="sr-only">Search vendors</label>
        <input
          id="vendor-search"
          type="search"
          placeholder="Search vendors…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-xs bg-ark-bg-elevated border border-ark-border rounded-lg px-3 py-2 text-ark-text-primary text-sm placeholder:text-ark-text-faint focus:outline-none focus:border-ark-primary focus:ring-1 focus:ring-ark-primary transition-colors"
        />
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-36 shimmer rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-3xl mb-3" aria-hidden="true">🏢</div>
          <h3 className="font-semibold text-ark-text-primary mb-1">
            {search ? 'No matching vendors' : 'No vendors yet'}
          </h3>
          <p className="text-ark-text-muted text-sm mb-4">
            {search
              ? 'Try a different search term.'
              : 'Vendors are auto-discovered from invoices. Upload your first invoice to get started.'}
          </p>
          {!search && (
            <Link
              href="/app/invoices/upload"
              className="inline-block bg-ark-primary hover:bg-ark-primary-hover text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-glow-primary-sm"
            >
              Upload Your First Invoice
            </Link>
          )}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((vendor) => (
            <Link
              key={vendor.id}
              href={`/app/vendors/${vendor.id}`}
              className="bg-ark-bg-card border border-ark-border rounded-xl p-5 hover:shadow-card-hover hover:border-ark-primary/25 transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 bg-ark-primary-muted border border-ark-primary/20 rounded-lg flex items-center justify-center text-ark-primary font-bold text-sm">
                  {vendor.name[0]?.toUpperCase()}
                </div>
                {Number(vendor.outstanding_total ?? 0) > 0 && (
                  <span className="bg-ark-primary-muted text-ark-primary text-xs font-semibold px-2 py-0.5 rounded-full tabular-nums">
                    {formatCurrency(Number(vendor.outstanding_total), vendor.preferred_currency)} outstanding
                  </span>
                )}
              </div>
              <h3 className="font-semibold text-ark-text-primary group-hover:text-ark-primary transition-colors truncate">
                {vendor.name}
              </h3>
              {vendor.email && (
                <p className="text-xs text-ark-text-faint truncate mt-0.5">{vendor.email}</p>
              )}
              <div className="flex items-center gap-3 mt-3">
                <span className={`text-xs font-medium tabular-nums ${avgDaysClass(vendor.avg_days_to_pay)}`}>
                  {vendor.avg_days_to_pay ? `${Math.round(vendor.avg_days_to_pay)}d avg` : 'No data'}
                </span>
                <span className="text-xs text-ark-text-faint">
                  {vendor.invoice_count} invoice{vendor.invoice_count !== 1 ? 's' : ''}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
