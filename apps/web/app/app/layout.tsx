'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/sidebar';
import { ToastContainer } from '@/components/ui/toast';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('ark_token');
    if (!token) {
      router.push('/auth/login');
    }
  }, [router]);

  return (
    <div className="flex min-h-screen bg-ark-bg">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 lg:ml-56 min-h-screen w-full">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center gap-3 px-4 h-14 border-b border-ark-border bg-ark-bg-elevated sticky top-0 z-20">
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-9 h-9 flex flex-col items-center justify-center gap-1.5 rounded-lg hover:bg-ark-bg-surface transition-colors"
            aria-label="Open navigation menu"
          >
            <span className="block w-5 h-0.5 bg-ark-text-primary rounded-full" />
            <span className="block w-5 h-0.5 bg-ark-text-primary rounded-full" />
            <span className="block w-5 h-0.5 bg-ark-text-primary rounded-full" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-ark-primary rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-glow-primary-sm">AF</div>
            <span className="font-bold text-sm text-ark-text-primary">ArkFlow</span>
          </div>
        </div>

        {children}
      </main>

      <ToastContainer />
    </div>
  );
}
