'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/sidebar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('ark_token');
    if (!token) {
      router.push('/auth/login');
    }
  }, [router]);

  return (
    <div className="flex min-h-screen bg-ark-bg">
      <Sidebar />
      <main className="flex-1 ml-56 min-h-screen">
        {children}
      </main>
    </div>
  );
}
