"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

interface CarlyLogoProps {
  showText?: boolean;
  className?: string;
}

export function CarlyLogo({ showText = true, className = "" }: CarlyLogoProps) {
  const { isLoggedOut, isBuyer, isDealerApproved } = useAuth();

  // Determine home route based on user state
  const getHomeRoute = () => {
    if (isDealerApproved) return "/dealer";
    if (isBuyer) return "/buyer";
    return "/";
  };

  return (
    <Link href={getHomeRoute()} className={`flex items-center gap-2 ${className}`} aria-label="Carly Home">
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 dark:from-blue-500 dark:to-purple-500 flex items-center justify-center transition-all duration-200 hover:scale-105">
        <span className="text-white text-sm font-bold">C</span>
      </div>
      {showText && (
        <span className="font-light text-xl md:text-2xl tracking-tight text-neutral-900 dark:text-neutral-100">
          Carly
        </span>
      )}
    </Link>
  );
}
