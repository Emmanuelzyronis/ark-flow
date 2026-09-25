'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';

const navItems = [
  { href: '/app/dashboard', label: 'Dashboard', icon: '◈' },
  { href: '/app/invoices', label: 'Invoices', icon: '📄' },
  { href: '/app/invoices/upload', label: 'Upload', icon: '⬆' },
  { href: '/app/reconcile', label: 'Reconcile', icon: '⚖' },
  { href: '/app/vendors', label: 'Vendors', icon: '🏢' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-56 bg-ark-bg-elevated border-r border-ark-border flex flex-col z-40">
      {/* Logo */}
      <div className="p-4 border-b border-ark-border">
        <Link href="/app/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-ark-primary rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-glow-primary-sm">
            AF
          </div>
          <div>
            <div className="font-bold text-ark-text-primary text-sm leading-none">ArkFlow</div>
            <div className="text-ark-text-faint text-xs mt-0.5">AP/AR Automation</div>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const active = pathname === item.href || (item.href !== '/app/dashboard' && pathname.startsWith(item.href + '/'));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150',
                active
                  ? 'bg-ark-bg-surface border-l-2 border-ark-primary text-ark-text-primary font-medium'
                  : 'text-ark-text-muted hover:text-ark-text-primary hover:bg-ark-bg-surface border-l-2 border-transparent'
              )}
            >
              <span className="text-base leading-none">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Upload FAB */}
      <div className="p-3 border-t border-ark-border">
        <Link
          href="/app/invoices/upload"
          className="flex items-center justify-center gap-2 w-full bg-ark-primary hover:bg-ark-primary-hover text-white py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-glow-primary-sm"
        >
          <span>+</span>
          Upload Invoice
        </Link>
      </div>

      {/* User */}
      <div className="p-3 border-t border-ark-border">
        <div className="flex items-center gap-2.5 px-2 py-2">
          <div className="w-7 h-7 bg-ark-primary-muted border border-ark-primary/30 rounded-full flex items-center justify-center text-xs font-bold text-ark-primary flex-shrink-0">
            {user?.name?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-ark-text-primary truncate">
              {user?.name ?? user?.email ?? 'Loading…'}
            </div>
            <div className="text-xs text-ark-text-faint truncate">{user?.email ?? ''}</div>
          </div>
          <button
            onClick={logout}
            className="text-ark-text-faint hover:text-ark-text-muted text-xs transition-colors flex-shrink-0"
            title="Sign out"
          >
            ⎋
          </button>
        </div>
      </div>
    </aside>
  );
}
