"use client";

import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function MeetCarlyPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());

  // Redirect dealers away from this page
  if (user?.role === 'dealer') {
    router.push('/dealer');
    return null;
  }

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => new Set(prev).add(entry.target.id));
          }
        });
      },
      { threshold: 0.2 }
    );

    document.querySelectorAll('section[id]').forEach((section) => {
      observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section 
        id="hero" 
        className={`relative px-8 pt-32 pb-32 transition-all duration-700 ${
          visibleSections.has('hero') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <div className="max-w-4xl mx-auto">
          <h1 className="text-6xl font-light tracking-tight bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent mb-8 dark:drop-shadow-[0_0_12px_rgba(139,92,246,0.35)]">
            Meet Carly
          </h1>

          <p className="text-2xl text-neutral-600 dark:text-neutral-400 font-light leading-relaxed mb-6">
            Carly is your decision system for buying a car — built to guide, not pressure.
          </p>

          <p className="text-lg text-neutral-500 dark:text-neutral-400 leading-relaxed mb-12">
            Buying a car is overwhelming, fragmented, and rushed. Too many listings, conflicting advice, 
            unclear pricing, and sales pressure everywhere. Carly organizes the entire process into 
            something understandable and safe — so you can move forward with confidence, not regret.
          </p>

          <button
            onClick={() => scrollToSection('problem')}
            className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-50 transition-colors duration-200"
          >
            See what Carly solves
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Transition Copy */}
      <div className="px-8 py-8 text-center">
        <p className="text-base text-neutral-400 dark:text-neutral-600 italic">
          Once you understand the problem, clarity follows.
        </p>
      </div>

      {/* The Problem */}
      <section 
        id="problem" 
        className={`px-8 py-32 bg-neutral-50 dark:bg-neutral-900/50 transition-all duration-700 ${
          visibleSections.has('problem') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <div className="max-w-4xl mx-auto">
          <h2 className="text-sm uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-12">
            The Problem Carly Solves
          </h2>

          <div className="space-y-3 mb-12">
            <p className="text-xl text-neutral-600 dark:text-neutral-400">Too many listings, no clarity</p>
            <p className="text-xl text-neutral-600 dark:text-neutral-400">Conflicting advice</p>
            <p className="text-xl text-neutral-600 dark:text-neutral-400">Sales pressure</p>
            <p className="text-xl text-neutral-600 dark:text-neutral-400">Unclear pricing</p>
            <p className="text-xl text-neutral-600 dark:text-neutral-400">Regret after the purchase</p>
          </div>

          <p className="text-2xl font-light bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
            Carly removes uncertainty by structuring the decision itself.
          </p>

          <button
            onClick={() => scrollToSection('how-carly-helps')}
            className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-50 transition-colors duration-200"
          >
            See how Carly helps
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Transition Copy */}
      <div className="px-8 py-8 text-center">
        <p className="text-base text-neutral-400 dark:text-neutral-600 italic">
          Structure removes pressure.
        </p>
      </div>

      {/* How Carly Helps */}
      <section 
        id="how-carly-helps" 
        className={`px-8 py-32 transition-all duration-700 ${
          visibleSections.has('how-carly-helps') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <div className="max-w-6xl mx-auto">
          <h2 className="text-sm uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-16">
            How Carly Helps
          </h2>

          <div className="space-y-24">
            {/* Understanding What Fits You */}
            <div className="max-w-3xl group cursor-pointer transition-all duration-200 hover:bg-neutral-50 dark:hover:bg-neutral-900/30 dark:shadow-[0_0_40px_rgba(59,130,246,0.15)] dark:hover:shadow-[0_0_55px_rgba(139,92,246,0.28)] p-6 -ml-6 rounded-lg">
              <h3 className="text-3xl font-light bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                Understanding What Fits You
              </h3>
              <p className="text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed mb-4 font-medium">
                Carly doesn't just ask what car you want — it learns what actually fits your life.
              </p>
              <p className="text-base text-neutral-500 dark:text-neutral-400 leading-relaxed">
                Through preference learning, behavior signals (likes, views, comparisons), budget awareness, 
                and lifestyle context, Carly builds an understanding of what matters to you — not just 
                what looks good in a photo.
              </p>
            </div>

            {/* Reducing Noise */}
            <div className="max-w-3xl group cursor-pointer transition-all duration-200 hover:bg-neutral-50 dark:hover:bg-neutral-900/30 dark:shadow-[0_0_40px_rgba(59,130,246,0.15)] dark:hover:shadow-[0_0_55px_rgba(139,92,246,0.28)] p-6 -ml-6 rounded-lg">
              <h3 className="text-3xl font-light bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                Reducing Noise, Not Options
              </h3>
              <p className="text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed mb-4 font-medium">
                Less scrolling. More clarity.
              </p>
              <p className="text-base text-neutral-500 dark:text-neutral-400 leading-relaxed">
                Carly filters out irrelevant listings and prioritizes quality over quantity. 
                You see vehicles that make sense for you, with explanations for why they fit — 
                not endless pages of options that all blur together.
              </p>
            </div>

            {/* Trust Built In */}
            <div className="max-w-3xl group cursor-pointer transition-all duration-200 hover:bg-neutral-50 dark:hover:bg-neutral-900/30 dark:shadow-[0_0_40px_rgba(59,130,246,0.15)] dark:hover:shadow-[0_0_55px_rgba(139,92,246,0.28)] p-6 -ml-6 rounded-lg">
              <h3 className="text-3xl font-light bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                Trust Built In
              </h3>
              <p className="text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed mb-4 font-medium">
                Trust isn't assumed — it's earned and shown.
              </p>
              <p className="text-base text-neutral-500 dark:text-neutral-400 leading-relaxed">
                Carly Verified listings, dealer reputation systems, verified interactions 
                (not fake reviews), and transparent signals mean you know what you're looking at. 
                No hidden agendas. No manufactured trust.
              </p>
            </div>

            {/* Pressure-Free Communication */}
            <div className="max-w-3xl group cursor-pointer transition-all duration-200 hover:bg-neutral-50 dark:hover:bg-neutral-900/30 dark:shadow-[0_0_40px_rgba(59,130,246,0.15)] dark:hover:shadow-[0_0_55px_rgba(139,92,246,0.28)] p-6 -ml-6 rounded-lg">
              <h3 className="text-3xl font-light bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                Pressure-Free Communication
              </h3>
              <p className="text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed mb-4 font-medium">
                You move forward when you're ready — not before.
              </p>
              <p className="text-base text-neutral-500 dark:text-neutral-400 leading-relaxed">
                Secure messaging, buyer-controlled engagement, and the ability to disengage cleanly 
                mean no spam, no chasing, no uncomfortable follow-ups. Communication happens on your terms.
              </p>
            </div>

            {/* Decision Confidence */}
            <div className="max-w-3xl group cursor-pointer transition-all duration-200 hover:bg-neutral-50 dark:hover:bg-neutral-900/30 dark:shadow-[0_0_40px_rgba(59,130,246,0.15)] dark:hover:shadow-[0_0_55px_rgba(139,92,246,0.28)] p-6 -ml-6 rounded-lg">
              <h3 className="text-3xl font-light bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                Decision Confidence
              </h3>
              <p className="text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed mb-4 font-medium">
                The goal isn't speed. It's confidence.
              </p>
              <p className="text-base text-neutral-500 dark:text-neutral-400 leading-relaxed">
                Carly explains why a vehicle fits, reduces regret, and ensures you leave informed — 
                not rushed. You're making a decision you understand, not one you were pushed into.
              </p>
            </div>
          </div>

          <div className="mt-16">
            <button
              onClick={() => scrollToSection('comparison')}
              className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-50 transition-colors duration-200"
            >
              See why this feels different
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Transition Copy */}
      <div className="px-8 py-8 text-center">
        <p className="text-base text-neutral-400 dark:text-neutral-600 italic">
          Trust isn't claimed — it's demonstrated.
        </p>
      </div>

      {/* Carly vs Traditional */}
      <section 
        id="comparison" 
        className={`px-8 py-32 bg-neutral-50 dark:bg-neutral-900/50 transition-all duration-700 ${
          visibleSections.has('comparison') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <div className="max-w-5xl mx-auto">
          <h2 className="text-sm uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-4">
            Carly vs Traditional Car Shopping
          </h2>
          <p className="text-sm text-neutral-400 dark:text-neutral-600 mb-12">
            Why this feels different
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="p-8 bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 opacity-60">
              <h3 className="text-lg font-medium bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent mb-6">
                Traditional
              </h3>
              <div className="space-y-3 text-neutral-600 dark:text-neutral-400">
                <p>Pushy</p>
                <p>Spec-driven</p>
                <p>Sales-first</p>
                <p>Fragmented</p>
                <p>Stressful</p>
              </div>
            </Card>

            <Card className="p-8 bg-white dark:bg-neutral-950 border-neutral-900 dark:border-neutral-100 border-2">
              <h3 className="text-lg font-medium bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent mb-6">
                Carly
              </h3>
              <div className="space-y-3 bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent font-medium">
                <p>Guided</p>
                <p>Context-aware</p>
                <p>Buyer-first</p>
                <p>Structured</p>
                <p>Calm</p>
              </div>
            </Card>
          </div>

          <div className="mt-16">
            <button
              onClick={() => scrollToSection('who-for')}
              className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-50 transition-colors duration-200"
            >
              See who Carly is for
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Who Carly Is For */}
      <section 
        id="who-for" 
        className={`px-8 py-32 transition-all duration-700 ${
          visibleSections.has('who-for') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <div className="max-w-4xl mx-auto">
          <h2 className="text-sm uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-12">
            Who Carly Is For
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="transition-all duration-200 hover:bg-neutral-50 dark:hover:bg-neutral-900/30 p-4 -ml-4 rounded-lg">
              <h3 className="text-xl font-medium bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent mb-3">
                First-time buyers
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400">
                Navigate the process with structure and clarity
              </p>
            </div>

            <div className="transition-all duration-200 hover:bg-neutral-50 dark:hover:bg-neutral-900/30 p-4 -ml-4 rounded-lg">
              <h3 className="text-xl font-medium bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent mb-3">
                Busy professionals
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400">
                Make informed decisions without endless research
              </p>
            </div>

            <div className="transition-all duration-200 hover:bg-neutral-50 dark:hover:bg-neutral-900/30 p-4 -ml-4 rounded-lg">
              <h3 className="text-xl font-medium bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent mb-3">
                People who hate sales pressure
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400">
                Buy on your terms, without feeling pushed
              </p>
            </div>

            <div className="transition-all duration-200 hover:bg-neutral-50 dark:hover:bg-neutral-900/30 p-4 -ml-4 rounded-lg">
              <h3 className="text-xl font-medium bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent mb-3">
                Anyone who wants to feel sure
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400">
                Leave with confidence, not uncertainty
              </p>
            </div>
          </div>

          <div className="mt-16">
            <button
              onClick={() => scrollToSection('closing')}
              className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-50 transition-colors duration-200"
            >
              What comes next
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Closing */}
      <section 
        id="closing" 
        className={`px-8 py-32 bg-neutral-50 dark:bg-neutral-900/50 transition-all duration-700 ${
          visibleSections.has('closing') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-3xl font-light bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent leading-relaxed mb-4">
            Carly doesn't tell you what to buy.
          </p>
          <p className="text-3xl font-light bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent leading-relaxed mb-16">
            Carly helps you understand enough to choose well.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {user ? (
              <>
                <Link href="/buyer">
                  <Button size="lg" className="h-14 px-12 text-base">
                    Browse with Confidence
                  </Button>
                </Link>
                <Link href="/browse">
                  <Button variant="ghost" size="lg" className="h-14 px-12 text-base">
                    Explore at your own pace
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/browse">
                  <Button size="lg" className="h-14 px-12 text-base">
                    Explore Vehicles
                  </Button>
                </Link>
                <Link href="/auth">
                  <Button variant="ghost" size="lg" className="h-14 px-12 text-base">
                    See what Carly looks like in practice
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
