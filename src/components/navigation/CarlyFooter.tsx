"use client";

import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export function CarlyFooter() {
  const { user } = useAuth();
  const isDealerView = user?.role === 'dealer';

  return (
    <footer className="bg-gradient-to-b from-neutral-900 to-neutral-950 dark:from-neutral-950 dark:to-black text-neutral-400 mt-auto">
      <div className="max-w-7xl mx-auto px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-16">
          {/* Product Understanding */}
          <div className="space-y-4">
            <h3 className="text-xs uppercase tracking-widest text-neutral-500 mb-4">
              Product
            </h3>
            <nav className="space-y-3">
              <Link href="/meet-carly" className="block text-sm hover:text-neutral-100 transition-colors duration-200">
                Meet Carly
              </Link>
              <Link href="/how-carly-works" className="block text-sm hover:text-neutral-100 transition-colors duration-200">
                How Carly Works
              </Link>
              <Link href="/carly-verified" className="block text-sm hover:text-neutral-100 transition-colors duration-200">
                Carly Verified
              </Link>
            </nav>
          </div>

          {/* Navigation Shortcuts */}
          {!isDealerView && (
            <div className="space-y-4">
              <h3 className="text-xs uppercase tracking-widest text-neutral-500 mb-4">
                Navigate
              </h3>
              <nav className="space-y-3">
                <Link href="/browse" className="block text-sm hover:text-neutral-100 transition-colors duration-200">
                  Browse
                </Link>
                {user && (
                  <>
                    <Link href="/buyer/garage" className="block text-sm hover:text-neutral-100 transition-colors duration-200">
                      Saved Vehicles
                    </Link>
                    <Link href="/buyer/messages" className="block text-sm hover:text-neutral-100 transition-colors duration-200">
                      Messages
                    </Link>
                    <Link href="/buyer/appointments" className="block text-sm hover:text-neutral-100 transition-colors duration-200">
                      Appointments
                    </Link>
                  </>
                )}
                <Link href="/luxury" className="block text-sm hover:text-neutral-100 transition-colors duration-200">
                  Luxury
                </Link>
              </nav>
            </div>
          )}

          {/* Support */}
          <div className="space-y-4">
            <h3 className="text-xs uppercase tracking-widest text-neutral-500 mb-4">
              Support
            </h3>
            <nav className="space-y-3">
              <Link href="/help-center" className="block text-sm hover:text-neutral-100 transition-colors duration-200">
                Help Center
              </Link>
              <Link href="/ask" className="block text-sm hover:text-neutral-100 transition-colors duration-200">
                Ask Carly
              </Link>
              <Link href="/accessibility" className="block text-sm hover:text-neutral-100 transition-colors duration-200">
                Accessibility
              </Link>
            </nav>
          </div>

          {/* Trust & Legitimacy */}
          <div className="space-y-4">
            <h3 className="text-xs uppercase tracking-widest text-neutral-500 mb-4">
              Trust & Safety
            </h3>
            <nav className="space-y-3">
              <Link href="/privacy-policy" className="block text-sm hover:text-neutral-100 transition-colors duration-200">
                Privacy Policy
              </Link>
              <Link href="/terms-of-use" className="block text-sm hover:text-neutral-100 transition-colors duration-200">
                Terms of Use
              </Link>
              <Link href="/trust-and-safety" className="block text-sm hover:text-neutral-100 transition-colors duration-200">
                Trust & Safety
              </Link>
              <Link href="/data-transparency" className="block text-sm hover:text-neutral-100 transition-colors duration-200">
                Data & Transparency
              </Link>
            </nav>
          </div>

        </div>

        {/* Closing Statement */}
        <div className="border-t border-neutral-800 pt-8 mb-8">
          <p className="text-center text-sm text-neutral-500 italic">
            Carly helps you choose well — not rush.
          </p>
        </div>

        {/* Legal */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-xs text-neutral-600">
          <span>© {new Date().getFullYear()} Vynance Technologies Inc.</span>
          <span className="hidden sm:block">•</span>
          <Link href="/terms-of-use" className="hover:text-neutral-400 transition-colors duration-200">
            Legal
          </Link>
          <span className="hidden sm:block">•</span>
          <Link href="/privacy-policy" className="hover:text-neutral-400 transition-colors duration-200">
            Cookies
          </Link>
        </div>
      </div>
    </footer>
  );
}
