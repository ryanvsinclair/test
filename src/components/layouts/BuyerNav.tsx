"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Heart, MessageSquare, User, Home, LogOut, Calendar, Sun, Moon, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { CarlyLogo } from "@/components/branding/CarlyLogo";
import { useState } from "react";

const navItems = [
  { href: "/buyer/browse", label: "Browse", icon: Home },
  { href: "/buyer/garage", label: "Garage", icon: Heart },
  { href: "/buyer/appointments", label: "Appointments", icon: Calendar },
  { href: "/buyer/messages", label: "Messages", icon: MessageSquare },
  { href: "/buyer/profile", label: "Profile", icon: User },
];

const meetCarlyNavItem = { href: "/meet-carly", label: "Meet Carly" };

export default function BuyerNav() {
  const pathname = usePathname();
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <CarlyLogo />

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center space-x-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/buyer/browse" && pathname?.startsWith(item.href + "/"));
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center space-x-2 px-3 xl:px-4 py-2 rounded-lg transition-all duration-200",
                  isActive
                    ? "bg-accent/10 text-accent"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
          
          <Link
            href={meetCarlyNavItem.href}
            className={cn(
              "flex items-center space-x-2 px-3 xl:px-4 py-2 rounded-lg transition-all duration-200",
              pathname === meetCarlyNavItem.href
                ? "bg-accent/10 text-accent"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <span className="text-sm font-medium">{meetCarlyNavItem.label}</span>
          </Link>
          
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
              const isActive = pathname === item.href || (item.href !== "/buyer/browse" && pathname?.startsWith(item.href + "/"));
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200",
                    isActive
                      ? "bg-accent/10 text-accent"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              );
            })}
            
            <Link
              href={meetCarlyNavItem.href}
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                "flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200",
                pathname === meetCarlyNavItem.href
                  ? "bg-accent/10 text-accent"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <span className="text-sm font-medium">{meetCarlyNavItem.label}</span>
            </Link>

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
