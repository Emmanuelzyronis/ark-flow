import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-ark-bg text-ark-text-primary">
      {/* Nav */}
      <nav className="border-b border-ark-border bg-ark-bg/90 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-ark-primary rounded-lg flex items-center justify-center text-white font-bold text-sm">
              AF
            </div>
            <span className="font-bold text-ark-text-primary">ArkFlow</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="text-sm text-ark-text-secondary hover:text-ark-text-primary transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/auth/register"
              className="bg-ark-primary hover:bg-ark-primary-hover text-white px-4 py-2 rounded text-sm font-medium transition-colors shadow-glow-primary-sm"
            >
              Start free
            </Link>
          </div>
        </div>
      </nav>

      {/* EU mandate banner */}
      <div className="bg-ark-accent/10 border-b border-ark-accent/20 text-center py-2.5 px-4">
        <p className="text-ark-accent text-xs font-medium">
          EU mandatory e-invoicing expanding to 12 countries in 2026 — automate before the deadline
        </p>
      </div>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 bg-ark-primary-muted border border-ark-primary/30 rounded-full px-3 py-1 mb-8">
          <span className="text-ark-primary text-xs font-semibold">AI-Native AP/AR</span>
        </div>
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6 text-ark-text-primary leading-tight">
          From PDF invoice to{' '}
          <span className="text-ark-primary">reconciled ledger</span>{' '}
          in minutes
        </h1>
        <p className="text-xl text-ark-text-secondary max-w-2xl mx-auto mb-10">
          Claude AI extracts every field from your invoices automatically.
          A deterministic engine reconciles payments. You click once to confirm.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link
            href="/auth/register"
            className="bg-ark-primary hover:bg-ark-primary-hover text-white px-8 py-4 rounded-lg text-base font-semibold transition-all shadow-glow-primary hover:shadow-glow-primary"
          >
            Start automating — it&apos;s free
          </Link>
          <Link
            href="/auth/login"
            className="border border-ark-border hover:border-ark-border-bright text-ark-text-secondary hover:text-ark-text-primary px-8 py-4 rounded-lg text-base font-medium transition-all"
          >
            Sign in
          </Link>
        </div>
        <p className="text-ark-text-faint text-sm mt-4">No credit card required</p>
      </section>

      {/* Stats */}
      <section className="border-y border-ark-border bg-ark-bg-elevated py-10">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: '$3T', label: 'B2B invoices processed manually in 2026' },
            { value: '8h+', label: 'SME hours lost to AP/AR per week' },
            { value: '30M', label: 'QuickBooks users who need this' },
            { value: '$49', label: 'Per month — vs $80+ from Bill.com' },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="text-3xl font-bold text-ark-primary tabular-nums">{stat.value}</div>
              <div className="text-ark-text-muted text-sm mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 py-24">
        <h2 className="text-3xl font-bold text-center mb-4">Everything you need</h2>
        <p className="text-ark-text-muted text-center mb-16 max-w-xl mx-auto">
          The full AP/AR workflow, automated by AI and enforced by deterministic reconciliation.
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: '📄',
              title: 'AI Invoice Extraction',
              desc: 'Upload a PDF. Claude extracts vendor, line items, amounts, due dates, and currency with confidence scores — in under 3 seconds.',
            },
            {
              icon: '⚖️',
              title: '12-Invariant Reconciliation',
              desc: 'Our deterministic engine matches payments to invoices using 12 enforced rules. Every match produces an immutable audit trail.',
            },
            {
              icon: '📬',
              title: 'Auto-Chase Emails',
              desc: 'One click drafts a payment-chase email with the right tone (polite → firm → final notice). Edit and send instantly.',
            },
            {
              icon: '📊',
              title: 'Aging Dashboard',
              desc: 'See all invoices bucketed into 30/60/90-day aging categories. Total outstanding and overdue amounts always visible.',
            },
            {
              icon: '🏢',
              title: 'Vendor Directory',
              desc: 'Vendors are auto-discovered from invoices. Track average days-to-pay, payment history, and outstanding balances per vendor.',
            },
            {
              icon: '🔗',
              title: 'Bank Reconciliation',
              desc: 'Connect your bank via open banking webhooks. Transactions auto-match to invoices. No more manual CSV exports.',
            },
          ].map((feature) => (
            <div key={feature.title} className="bg-ark-bg-card border border-ark-border rounded-xl p-6 hover:border-ark-primary/30 hover:shadow-card-hover transition-all">
              <div className="text-3xl mb-4">{feature.icon}</div>
              <h3 className="text-base font-semibold text-ark-text-primary mb-2">{feature.title}</h3>
              <p className="text-ark-text-muted text-sm leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-ark-bg-elevated border-y border-ark-border py-24">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-16">How it works</h2>
          <div className="space-y-8">
            {[
              {
                step: '01',
                title: 'Upload your invoice',
                desc: 'Drag and drop a PDF or image. Claude AI extracts every field — vendor name, line items, amounts, due date, currency — with a confidence score for each.',
              },
              {
                step: '02',
                title: 'Review and confirm',
                desc: 'A structured form shows the extracted data. Low-confidence fields are highlighted. Fix anything, then confirm with one click. Invoice saved to your ledger.',
              },
              {
                step: '03',
                title: 'Reconcile payments',
                desc: 'When payment arrives, our 12-invariant engine auto-matches it to the invoice. Every step is logged in an immutable audit trail.',
              },
            ].map((step) => (
              <div key={step.step} className="flex gap-6">
                <div className="flex-shrink-0 w-12 h-12 bg-ark-primary-muted border border-ark-primary/30 rounded-lg flex items-center justify-center">
                  <span className="text-ark-primary font-bold text-sm">{step.step}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-ark-text-primary mb-1">{step.title}</h3>
                  <p className="text-ark-text-muted text-sm leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-6xl mx-auto px-4 py-24 text-center">
        <h2 className="text-3xl font-bold mb-4">Simple pricing</h2>
        <p className="text-ark-text-muted mb-12">No enterprise contracts. No per-seat nonsense.</p>
        <div className="max-w-sm mx-auto bg-ark-bg-card border-2 border-ark-primary rounded-2xl p-8 shadow-glow-primary-sm">
          <div className="text-ark-text-muted text-sm font-semibold uppercase tracking-wider mb-2">Starter</div>
          <div className="text-5xl font-bold text-ark-primary tabular-nums mb-1">$49</div>
          <div className="text-ark-text-muted text-sm mb-8">per month</div>
          <ul className="text-left space-y-3 mb-8">
            {[
              'Unlimited invoice uploads',
              'Claude AI extraction on every invoice',
              '12-invariant reconciliation engine',
              'Payment chase email automation',
              'Vendor directory & analytics',
              'Immutable audit trail',
              'QuickBooks & Xero export',
            ].map((feature) => (
              <li key={feature} className="flex items-center gap-3 text-sm text-ark-text-secondary">
                <span className="text-ark-success">✓</span>
                {feature}
              </li>
            ))}
          </ul>
          <Link
            href="/auth/register"
            className="w-full block bg-ark-primary hover:bg-ark-primary-hover text-white py-3 rounded-lg font-semibold text-sm transition-colors shadow-glow-primary-sm text-center"
          >
            Start free trial
          </Link>
        </div>
        <p className="text-ark-text-faint text-xs mt-4">
          Compare: Bill.com $45–80/user/month · Tipalti enterprise-only
        </p>
      </section>

      {/* CTA */}
      <section className="bg-ark-bg-elevated border-t border-ark-border py-20 text-center px-4">
        <h2 className="text-3xl font-bold mb-4">
          Stop processing invoices manually.
        </h2>
        <p className="text-ark-text-muted mb-8 max-w-xl mx-auto">
          Join thousands of SMEs saving 8+ hours per week with AI-native AP/AR automation.
        </p>
        <Link
          href="/auth/register"
          className="inline-block bg-ark-primary hover:bg-ark-primary-hover text-white px-8 py-4 rounded-lg text-base font-semibold transition-all shadow-glow-primary"
        >
          Get started — free
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-ark-border py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-ark-primary rounded flex items-center justify-center text-white font-bold text-xs">AF</div>
            <span className="text-ark-text-muted text-sm">ArkFlow</span>
          </div>
          <p className="text-ark-text-faint text-xs">
            Built for the Build, Ship, Shape: Amazon Developer Hackathon 2026
          </p>
          <div className="flex gap-4 text-xs text-ark-text-faint">
            <Link href="/auth/login" className="hover:text-ark-text-muted transition-colors">Sign in</Link>
            <Link href="/auth/register" className="hover:text-ark-text-muted transition-colors">Sign up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
