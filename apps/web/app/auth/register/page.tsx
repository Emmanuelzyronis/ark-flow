'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const nameError = touched.name && !name.trim() ? 'Name is required' : '';
  const orgError = touched.orgName && !orgName.trim() ? 'Company is required' : '';
  const canSubmit = !!name.trim() && !!orgName.trim();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      await register(email, password, name, orgName);
      router.push('/app/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-ark-bg flex items-center justify-center px-4">
      <div className="fixed inset-0 bg-[linear-gradient(rgba(249,115,22,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(249,115,22,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      <div className="relative w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-ark-primary rounded-lg flex items-center justify-center text-white font-bold">AF</div>
            <span className="font-bold text-xl text-ark-text-primary">ArkFlow</span>
          </Link>
          <h1 className="text-2xl font-bold text-ark-text-primary">Create your account</h1>
          <p className="text-ark-text-muted text-sm mt-1">Start automating AP/AR in minutes</p>
        </div>

        <div className="bg-ark-bg-card border border-ark-border rounded-xl p-8 shadow-card">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-ark-danger-bg border border-ark-danger/30 rounded px-3 py-2 text-sm text-ark-danger">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label htmlFor="reg-name" className="block text-xs font-semibold uppercase tracking-wider text-ark-text-muted">
                  Your Name
                </label>
                <input
                  id="reg-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={() => setTouched((p) => ({ ...p, name: true }))}
                  className={`w-full bg-ark-bg-elevated border rounded px-3 py-2.5 text-ark-text-primary text-sm placeholder:text-ark-text-faint focus:outline-none focus:ring-1 transition-colors ${
                    nameError
                      ? 'border-ark-danger focus:border-ark-danger focus:ring-ark-danger'
                      : 'border-ark-border focus:border-ark-primary focus:ring-ark-primary'
                  }`}
                  placeholder="Jane Doe"
                  autoComplete="name"
                />
                {nameError && <p className="text-xs text-ark-danger mt-0.5">{nameError}</p>}
              </div>
              <div className="space-y-1">
                <label htmlFor="reg-company" className="block text-xs font-semibold uppercase tracking-wider text-ark-text-muted">
                  Company
                </label>
                <input
                  id="reg-company"
                  type="text"
                  required
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  onBlur={() => setTouched((p) => ({ ...p, orgName: true }))}
                  className={`w-full bg-ark-bg-elevated border rounded px-3 py-2.5 text-ark-text-primary text-sm placeholder:text-ark-text-faint focus:outline-none focus:ring-1 transition-colors ${
                    orgError
                      ? 'border-ark-danger focus:border-ark-danger focus:ring-ark-danger'
                      : 'border-ark-border focus:border-ark-primary focus:ring-ark-primary'
                  }`}
                  placeholder="Acme Inc."
                  autoComplete="organization"
                />
                {orgError && <p className="text-xs text-ark-danger mt-0.5">{orgError}</p>}
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="reg-email" className="block text-xs font-semibold uppercase tracking-wider text-ark-text-muted">
                Work Email
              </label>
              <input
                id="reg-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-ark-bg-elevated border border-ark-border rounded px-3 py-2.5 text-ark-text-primary text-sm placeholder:text-ark-text-faint focus:outline-none focus:border-ark-primary focus:ring-1 focus:ring-ark-primary transition-colors"
                placeholder="you@company.com"
                autoComplete="email"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="reg-password" className="block text-xs font-semibold uppercase tracking-wider text-ark-text-muted">
                Password
              </label>
              <input
                id="reg-password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-ark-bg-elevated border border-ark-border rounded px-3 py-2.5 text-ark-text-primary text-sm placeholder:text-ark-text-faint focus:outline-none focus:border-ark-primary focus:ring-1 focus:ring-ark-primary transition-colors"
                placeholder="8+ characters"
                autoComplete="new-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !canSubmit}
              className="w-full bg-ark-primary hover:bg-ark-primary-hover disabled:opacity-50 text-white py-2.5 rounded font-semibold text-sm transition-colors shadow-glow-primary-sm flex items-center justify-center gap-2 mt-2"
            >
              {loading && (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        </div>

        <p className="text-center text-ark-text-muted text-sm mt-6">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-ark-primary hover:text-ark-primary-glow transition-colors font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
