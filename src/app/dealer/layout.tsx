"use client";

import { ReactNode, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import DealerSidebar from '@/components/dealer/DealerSidebar';

export default function DealerLayout({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // Prefetch key dealer routes for instant navigation
  useEffect(() => {
    router.prefetch('/dealer');
    router.prefetch('/dealer/listings');
    router.prefetch('/dealer/appointments');
    router.prefetch('/dealer/messages');
    router.prefetch('/dealer/insights');
    router.prefetch('/dealer/reputation');
    router.prefetch('/dealer/settings');
  }, [router]);

  // CRITICAL: Wait for auth to finish loading
  // Do NOT redirect - middleware handles all routing
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-neutral-300 border-t-neutral-900 dark:border-neutral-700 dark:border-t-neutral-100 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-neutral-500">Loading...</p>
        </div>
      </div>
    );
  }

  // CRITICAL: If not authenticated or not a dealer, let middleware handle redirect
  // Do NOT redirect on client - causes race condition with middleware
  if (!user || user.role !== 'dealer') {
    return null;
  }

  return (
    <div className="flex h-screen">
      <DealerSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="animate-in fade-in duration-200">
          {children}
        </div>
      </main>
    </div>
  );
}
