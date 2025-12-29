"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, ReactNode } from "react";

export default function RouteGuard({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    const isBuyerRoute = pathname?.startsWith("/buyer");
    const isDealerRoute = pathname?.startsWith("/seller") || pathname?.startsWith("/dealer");
    const isAuthRoute = pathname?.startsWith("/auth");

    // Redirect authenticated users away from auth pages
    // AuthContext handles the actual dashboard redirect
    if (user && isAuthRoute) {
      // Silent return - login function already handled redirect
      return;
    }
  }, [user, isLoading, pathname, router]);

  return <>{children}</>;
}
