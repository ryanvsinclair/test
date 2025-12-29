"use client";

import { Button } from "@/components/ui/button";
import { Car, Building2, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface RoleSelectionProps {
  onSelectRole: (role: "buyer" | "dealer") => void;
}

export default function RoleSelection({ onSelectRole }: RoleSelectionProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6 py-20">
      <div className="w-full max-w-2xl my-auto space-y-8">
        {/* Back Button */}
        <div className="flex justify-start">
          <Link 
            href="/" 
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to browsing
          </Link>
        </div>

        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-light tracking-tight">Welcome to Carly</h1>
          <p className="text-sm text-muted-foreground">Choose how you'd like to continue</p>
        </div>

        {/* Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Buyer Card */}
          <button
            onClick={() => onSelectRole("buyer")}
            className="group p-8 rounded-2xl border-2 border-border hover:border-accent/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 text-left bg-card"
          >
            <div className="w-14 h-14 rounded-xl mb-4 flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--accent-glow))' }}>
              <Car className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-semibold mb-2">I'm looking for a vehicle</h2>
            <p className="text-sm text-muted-foreground">Browse, save, and message sellers</p>
          </button>

          {/* Dealer Card */}
          <button
            onClick={() => onSelectRole("dealer")}
            className="group p-8 rounded-2xl border-2 border-border hover:border-accent/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 text-left bg-card"
          >
            <div className="w-14 h-14 rounded-xl mb-4 flex items-center justify-center bg-muted">
              <Building2 className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-semibold mb-2">I'm a dealer</h2>
            <p className="text-sm text-muted-foreground">Manage inventory and clients</p>
          </button>
        </div>
      </div>
    </div>
  );
}
