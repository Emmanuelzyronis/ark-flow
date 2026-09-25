'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.push('/app/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-ark-bg flex items-center justify-center px-4">
      {/* Grid pattern */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(249,115,22,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(249,115,22,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      <div className="relative w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-ark-primary rounded-lg flex items-center justify-center text-white font-bold">AF</div>
            <span className="font-bold text-xl text-ark-text-primary">ArkFlow</span>
          </Link>
          <h1 className="text-2xl font-bold text-ark-text-primary">Welcome back</h1>
          <p className="text-ark-text-muted text-sm mt-1">Sign in to your account</p>
        </div>

        <div className="bg-ark-bg-card border border-ark-border rounded-xl p-8 shadow-card">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-ark-danger-bg border border-ark-danger/30 rounded px-3 py-2 text-sm text-ark-danger">
                {error}
              </div>
            )}

            <div className="space-y-1">
              <label htmlFor="login-email" className="block text-xs font-semibold uppercase tracking-wider text-ark-text-muted">
                Email
              </label>
              <input
                id="login-email"
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
              <label htmlFor="login-password" className="block text-xs font-semibold uppercase tracking-wider text-ark-text-muted">
                Password
              </label>
              <input
                id="login-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-ark-bg-elevated border border-ark-border rounded px-3 py-2.5 text-ark-text-primary text-sm placeholder:text-ark-text-faint focus:outline-none focus:border-ark-primary focus:ring-1 focus:ring-ark-primary transition-colors"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-ark-primary hover:bg-ark-primary-hover disabled:opacity-50 text-white py-2.5 rounded font-semibold text-sm transition-colors shadow-glow-primary-sm flex items-center justify-center gap-2"
            >
              {loading && (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center text-ark-text-muted text-sm mt-6">
          No account?{' '}
          <Link href="/auth/register" className="text-ark-primary hover:text-ark-primary-glow transition-colors font-medium">
            Create one free
          </Link>
        </p>
      </div>
    </div>
  );
}
