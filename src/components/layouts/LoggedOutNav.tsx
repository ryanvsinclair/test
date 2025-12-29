"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import { Sun, Moon, Menu, X } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { CarlyLogo } from "@/components/branding/CarlyLogo";
import { useState } from "react";

export default function LoggedOutNav() {
  const pathname = usePathname();
  const isAuthPage = pathname?.startsWith("/auth");
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Hide nav completely during auth flow
  if (isAuthPage) {
    return null;
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border transition-all" style={{ transitionDuration: 'var(--motion-base)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <CarlyLogo />
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-2 lg:gap-4">
          <Link href="/browse">
            <Button variant="ghost" size="sm" className="rounded-lg transition-all hover:scale-105" style={{ transitionDuration: 'var(--motion-base)' }}>
              Browse
            </Button>
          </Link>
          <Link href="/meet-carly">
            <Button variant="ghost" size="sm" className="rounded-lg transition-all hover:scale-105" style={{ transitionDuration: 'var(--motion-base)' }}>
              Meet Carly
            </Button>
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
          <Link href="/auth">
            <Button size="sm" className="rounded-lg transition-all hover:scale-105" style={{ transitionDuration: 'var(--motion-base)' }}>
              Sign In
            </Button>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200 text-foreground hover:bg-muted/50"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-md">
          <div className="px-4 py-4 space-y-2">
            <Link href="/browse" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start rounded-lg">
                Browse
              </Button>
            </Link>
            <Link href="/meet-carly" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start rounded-lg">
                Meet Carly
              </Button>
            </Link>
            <button
              onClick={() => {
                toggleTheme();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-muted/50"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4" />
                  <span>Dark Mode</span>
                </>
              )}
            </button>
            <Link href="/auth" onClick={() => setMobileMenuOpen(false)}>
              <Button className="w-full rounded-lg">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
