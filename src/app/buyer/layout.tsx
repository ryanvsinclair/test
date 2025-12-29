"use client";

import { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usePathname } from "next/navigation";
import BuyerNav from "@/components/layouts/BuyerNav";

export default function BuyerLayout({ children }: { children: ReactNode }) {
  const { user, isBuyer, isLoading } = useAuth();
  const pathname = usePathname();

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

  // CRITICAL: If not authenticated or not a buyer, let middleware handle redirect
  // Do NOT redirect on client - causes race condition with middleware
  if (!user || !isBuyer) {
    return null;
  }

  return (
    <>
      <BuyerNav />
      <main>{children}</main>
    </>
  );
}
