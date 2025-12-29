'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Car, MessageSquare, Users, Settings, LogOut, Calendar, Sun, Moon, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const navItems = [
  { href: '/seller', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/seller/inventory', label: 'Inventory', icon: Car },
  { href: '/seller/appointments', label: 'Appointments', icon: Calendar },
  { href: '/seller/messages', label: 'Messages', icon: MessageSquare },
  { href: '/seller/clients', label: 'Clients', icon: Users },
  { href: '/seller/settings', label: 'Settings', icon: Settings },
];

export function SellerNav() {
  const pathname = usePathname();
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/seller" className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[hsl(215,20%,65%)] to-[hsl(270,15%,65%)] flex items-center justify-center">
            <Car className="w-4 h-4 text-white" />
          </div>
          <span className="text-xl font-light tracking-tight">AutoMarket</span>
          <span className="hidden sm:inline text-xs font-medium text-muted-foreground ml-2 px-2 py-1 rounded-md bg-muted">
            Seller
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center space-x-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center space-x-2 px-3 xl:px-4 py-2 rounded-lg transition-all duration-200 relative',
                  isActive
                    ? 'text-foreground gradient-underline'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
          
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-muted/50"
            aria-label="Toggle dark mode"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>
          
          <Button
            onClick={logout}
            variant="ghost"
            size="sm"
            className="flex items-center space-x-2 px-3 xl:px-4 py-2 rounded-lg transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-muted/50"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-medium">Log out</span>
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200 text-foreground hover:bg-muted/50"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-border bg-background/95 backdrop-blur-md">
          <div className="px-4 py-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200',
                    isActive
                      ? 'text-foreground bg-accent/10'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              );
            })}

            <button
              onClick={() => {
                toggleTheme();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-muted/50"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4" />
                  <span className="text-sm font-medium">Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4" />
                  <span className="text-sm font-medium">Dark Mode</span>
                </>
              )}
            </button>

            <button
              onClick={() => {
                logout();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-muted/50"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">Log out</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
