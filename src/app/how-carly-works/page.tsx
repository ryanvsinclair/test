"use client";

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function HowCarlyWorksPage() {
  const { user } = useAuth();
  const router = useRouter();

  if (user?.role === 'dealer') {
    router.push('/dealer');
    return null;
  }

  return (
    <div className="min-h-screen">
      <section className="relative px-8 pt-32 pb-24">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-6xl font-light tracking-tight bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent mb-8 dark:drop-shadow-[0_0_12px_rgba(139,92,246,0.35)]">
            How Carly Works
          </h1>

          <p className="text-2xl text-neutral-600 dark:text-neutral-400 font-light leading-relaxed mb-16">
            Carly organizes car buying into a structured, pressure-free process — from discovery to decision.
          </p>

          <div className="space-y-24">
            {/* Step 1 */}
            <div>
              <p className="text-sm uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-4">
                Step 1
              </p>
              <h2 className="text-3xl font-light bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                Explore Without Pressure
              </h2>
              <p className="text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed mb-4">
                Browse vehicles without creating an account. No tracking, no retargeting, no pressure to commit.
              </p>
              <p className="text-base text-neutral-500 dark:text-neutral-400 leading-relaxed">
                Use filters to narrow by price, make, model, location, and features. Save vehicles to compare later. 
                Everything stays private until you decide to reach out.
              </p>
            </div>

            {/* Step 2 */}
            <div>
              <p className="text-sm uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-4">
                Step 2
              </p>
              <h2 className="text-3xl font-light bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                Carly Learns Your Preferences
              </h2>
              <p className="text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed mb-4">
                As you browse, save, and compare vehicles, Carly learns what matters to you.
              </p>
              <p className="text-base text-neutral-500 dark:text-neutral-400 leading-relaxed">
                Not through surveys — through behavior. What you view, what you ignore, what you return to. 
                Over time, Carly surfaces vehicles that fit your actual needs, not just your stated preferences.
              </p>
            </div>

            {/* Step 3 */}
            <div>
              <p className="text-sm uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-4">
                Step 3
              </p>
              <h2 className="text-3xl font-light bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                Message Sellers Securely
              </h2>
              <p className="text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed mb-4">
                When you're ready, message sellers or dealers directly through Carly.
              </p>
              <p className="text-base text-neutral-500 dark:text-neutral-400 leading-relaxed">
                Your contact information stays private. No phone number sharing unless you choose to. 
                You control the pace of the conversation. No spam. No follow-up calls. No pressure tactics.
              </p>
            </div>

            {/* Step 4 */}
            <div>
              <p className="text-sm uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-4">
                Step 4
              </p>
              <h2 className="text-3xl font-light bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                Book Appointments on Your Terms
              </h2>
              <p className="text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed mb-4">
                Schedule appointments directly through Carly.
              </p>
              <p className="text-base text-neutral-500 dark:text-neutral-400 leading-relaxed">
                Choose times that work for you. Confirm, reschedule, or cancel without awkward phone calls. 
                All communication stays in one place. No double-booking. No confusion.
              </p>
            </div>

            {/* Step 5 */}
            <div>
              <p className="text-sm uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-4">
                Step 5
              </p>
              <h2 className="text-3xl font-light bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                Make an Informed Decision
              </h2>
              <p className="text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed mb-4">
                Carly doesn't tell you what to buy — it helps you understand enough to choose well.
              </p>
              <p className="text-base text-neutral-500 dark:text-neutral-400 leading-relaxed">
                Compare vehicles side-by-side. Review dealer reputation. See verified listings. 
                When you decide, you'll know why — not because someone pushed you, but because the decision made sense.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-8 py-24 bg-neutral-50 dark:bg-neutral-900/50">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-2xl font-light bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
            This is how car buying should work — structured, transparent, and on your terms.
          </p>

          <div className="flex gap-4 justify-center">
            {user ? (
              <Link href="/buyer">
                <Button size="lg" className="h-14 px-12 text-base">
                  Start Browsing
                </Button>
              </Link>
            ) : (
              <Link href="/">
                <Button size="lg" className="h-14 px-12 text-base">
                  Explore Vehicles
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
