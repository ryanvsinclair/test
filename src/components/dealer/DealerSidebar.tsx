"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { 
  LayoutDashboard, 
  Car, 
  MessageSquare, 
  Calendar, 
  Star, 
  TrendingUp, 
  Settings,
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CarlyLogo } from '@/components/branding/CarlyLogo';
import { ThemeSwitcher } from '@/components/theme-switcher';

const navigation = [
  { name: 'Dashboard', href: '/dealer', icon: LayoutDashboard },
  { name: 'Listings', href: '/dealer/listings', icon: Car },
  { name: 'Messages', href: '/dealer/messages', icon: MessageSquare },
  { name: 'Appointments', href: '/dealer/appointments', icon: Calendar },
  { name: 'Reputation', href: '/dealer/reputation', icon: Star },
  { name: 'Insights', href: '/dealer/insights', icon: TrendingUp },
  { name: 'Settings', href: '/dealer/settings', icon: Settings },
];

export default function DealerSidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuth();

  return (
    <aside className="w-64 border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-card flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-neutral-200 dark:border-neutral-800">
        <CarlyLogo showText={true} />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all motion-base motion-smooth group",
                isActive
                  ? "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 font-medium"
                  : "text-neutral-600 dark:text-neutral-300 hover:bg-blue-50/50 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100"
              )}
            >
              <item.icon className={cn(
                "w-5 h-5 transition-transform motion-base",
                "group-hover:translate-x-[2px]"
              )} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="border-t border-neutral-200 dark:border-neutral-800 p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center">
            <span className="text-neutral-700 dark:text-neutral-200 font-medium text-sm">
              {user?.email?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
              {user?.email}
            </p>
            <p className="text-xs text-neutral-500">Dealer Account</p>
          </div>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <ThemeSwitcher />
          <span className="text-xs text-neutral-500 dark:text-neutral-400">Theme</span>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
