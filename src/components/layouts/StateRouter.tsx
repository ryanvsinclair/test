"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

import RouteGuard from "./RouteGuard";
import LoggedOutNav from "./LoggedOutNav";
import BuyerNav from "./BuyerNav";
import DealerNav from "./DealerNav";
import { CarlyFooter } from "@/components/navigation/CarlyFooter";

export default function StateRouter({ children }: { children: ReactNode }) {
  const { isLoggedOut, isBuyer, isDealerApproved, isAdmin, isLoading } = useAuth();
  const pathname = usePathname();

  /* -------------------------------------------------
   * 🚨 ADMIN ROUTES BYPASS STATE ROUTER COMPLETELY
   * ------------------------------------------------- */
  if (pathname?.startsWith("/admin")) {
    return <>{children}</>;
  }

  /* -------------------------------------------------
   * 🚨 AUTH ROUTES MUST BYPASS STATE ROUTER COMPLETELY
   * ------------------------------------------------- */
  if (pathname?.startsWith("/auth")) {
    return <>{children}</>;
  }

  /* ----------------------------------------
   * ⏳ Initial auth hydration gate ONLY
   * ---------------------------------------- */
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-border border-t-foreground rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  /* ----------------------------------------
   * App UI routing (NO redirects here)
   * ---------------------------------------- */

  // Logged out experience (or public pages)
  const publicPages = ['/', '/browse', '/welcome', '/meet-carly', '/how-carly-works', '/help-center', '/trust-and-safety', '/data-transparency', '/privacy-policy', '/terms-of-use', '/carly-verified', '/luxury', '/ask', '/contact-carly', '/accessibility', '/report-issue'];
  
  if (isLoggedOut || publicPages.includes(pathname || '')) {
    return (
      <RouteGuard>
        <div className="min-h-screen bg-background flex flex-col">
          <LoggedOutNav />
          <main className="flex-1">{children}</main>
          <CarlyFooter />
        </div>
      </RouteGuard>
    );
  }

  // Buyer experience
  if (isBuyer) {
    return (
      <RouteGuard>
        <div className="min-h-screen bg-background flex flex-col">
          <BuyerNav />
          <main className="pt-16 flex-1">{children}</main>
          <CarlyFooter />
        </div>
      </RouteGuard>
    );
  }

  // Dealer experience
  if (isDealerApproved) {
    return (
      <RouteGuard>
        <div className="min-h-screen bg-background flex flex-col">
          <DealerNav />
          <main className="flex-1">{children}</main>
        </div>
      </RouteGuard>
    );
  }

  /* ----------------------------------------
   * Fallback: authenticated but edge-case user
   * (e.g., pending dealer, invalid role)
   * Middleware handles redirects - just render children
   * ---------------------------------------- */
  return <RouteGuard>{children}</RouteGuard>;
}
