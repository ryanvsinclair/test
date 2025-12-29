"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { LayoutDashboard, Package, MessageSquare, Users, Settings } from "lucide-react";

export default function DealerNav() {
  const { logout } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link href="/seller" className="text-xl font-light tracking-tight text-white">
            Carly<span className="text-white/40 ml-2 text-sm">Dealer</span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <Link href="/seller" className="text-sm text-white/60 hover:text-white transition-colors flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Link>
            <Link href="/seller/inventory" className="text-sm text-white/60 hover:text-white transition-colors flex items-center gap-2">
              <Package className="w-4 h-4" />
              Inventory
            </Link>
            <Link href="/seller/clients" className="text-sm text-white/60 hover:text-white transition-colors flex items-center gap-2">
              <Users className="w-4 h-4" />
              Clients
            </Link>
            <Link href="/seller/messages" className="text-sm text-white/60 hover:text-white transition-colors flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Messages
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/seller/settings">
            <Button variant="ghost" size="icon" className="rounded-lg text-white/60 hover:text-white hover:bg-white/5">
              <Settings className="w-5 h-5" />
            </Button>
          </Link>
          <Button onClick={logout} variant="ghost" className="text-sm text-white/60 hover:text-white hover:bg-white/5">
            Sign Out
          </Button>
        </div>
      </div>
    </nav>
  );
}
