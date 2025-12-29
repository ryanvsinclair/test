"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowRight, Lightbulb, Filter, CheckCircle2 } from "lucide-react";
import { MatchFlow } from "@/components/match/MatchFlow";
import { MatchResults } from "@/components/match/MatchResults";
import type { MatchProfile } from "@/components/match/MatchFlow";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export default function LandingPage() {
  const router = useRouter();
  const { user, isBuyer } = useAuth();
  const [showMatchFlow, setShowMatchFlow] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [matchProfile, setMatchProfile] = useState<MatchProfile | null>(null);

  const handleMatchComplete = (profile: MatchProfile) => {
    setMatchProfile(profile);
    setShowMatchFlow(false);
    setShowResults(true);
  };

  const handleCreateAccount = () => {
    if (matchProfile) {
      localStorage.setItem('carlyMatchProfile', JSON.stringify(matchProfile));
    }
    router.push('/auth/buyer');
  };

  const handleContinueWithoutAccount = () => {
    if (matchProfile) {
      localStorage.setItem('carlyMatchProfile', JSON.stringify(matchProfile));
    }
    router.push('/browse');
  };

  const handleBrowseClick = () => {
    if (user && isBuyer) {
      router.push('/buyer/browse');
    } else {
      router.push('/browse');
    }
  };

  const scrollToHowItHelps = () => {
    const section = document.getElementById('how-it-helps');
    section?.scrollIntoView({ behavior: 'smooth' });
  };

  if (showMatchFlow) {
    return (
      <MatchFlow
        onComplete={handleMatchComplete}
        onClose={() => setShowMatchFlow(false)}
      />
    );
  }

  if (showResults && matchProfile) {
    return (
      <MatchResults
        profile={matchProfile}
        onCreateAccount={handleCreateAccount}
        onContinueWithoutAccount={handleContinueWithoutAccount}
      />
    );
  }

  return (
    <div className="min-h-screen">
      
      {/* Empathy-First Hero */}
      <section className="min-h-screen flex flex-col items-center justify-center px-6 py-16 relative">
        <div className="max-w-3xl mx-auto space-y-16 animate-in fade-in slide-in-from-bottom-3 duration-700">
          
          {/* Headline - Large, Calm */}
          <div className="text-center space-y-6">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-light tracking-tight leading-[1.1] bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent dark:drop-shadow-[0_0_12px_rgba(139,92,246,0.35)]">
              Buying a car shouldn't feel this confusing
            </h1>
            <p className="text-lg md:text-xl text-neutral-600 dark:text-neutral-400 font-light leading-relaxed max-w-2xl mx-auto">
              Most people aren't sure what they need, what to trust, or where to start.
              <br />
              Carly exists to remove that uncertainty — step by step.
            </p>
          </div>

          {/* Proof of Understanding */}
          <div className="space-y-6 animate-in fade-in duration-700 delay-300">
            <div className="space-y-4">
              {[
                "I don't know what actually fits my life.",
                "I'm worried I'll regret the choice.",
                "I don't trust listings or sales pressure."
              ].map((statement, idx) => (
                <div 
                  key={idx}
                  className="text-center text-neutral-700 dark:text-neutral-300 italic"
                  style={{ 
                    animationDelay: `${(idx + 1) * 100}ms`,
                    opacity: 0,
                    animation: 'fadeInUp 500ms ease-out forwards'
                  }}
                >
                  &quot;{statement}&quot;
                </div>
              ))}
            </div>
            
            <p className="text-center text-base font-medium pt-4">
              If any of this sounds familiar, you&apos;re in the right place.
            </p>
          </div>

          {/* First CTA - Low Commitment */}
          <div className="text-center animate-in fade-in duration-700 delay-500">
            <Button
              variant="outline"
              size="lg"
              onClick={scrollToHowItHelps}
              className="h-12 px-8 text-base rounded-xl transition-all hover:bg-neutral-100 dark:hover:bg-neutral-900"
            >
              See how Carly helps
            </Button>
          </div>
        </div>
      </section>

      {/* How Carly Helps - Expanded Trust-Building */}
      <section id="how-it-helps" className="py-32 px-6 bg-white dark:bg-neutral-950">
        <div className="max-w-5xl mx-auto space-y-32">
          
          {/* Part 1 — Reassurance */}
          <div className="text-center space-y-6 max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-light tracking-tight leading-tight bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
              You don&apos;t need to be an expert to make a good choice
            </h2>
            <p className="text-xl text-neutral-600 dark:text-neutral-400 leading-relaxed">
              Most people don&apos;t know what trim level they need, what MPG is realistic, or whether they should prioritize safety ratings. That&apos;s completely normal. Carly exists to turn uncertainty into clarity — without requiring you to become a car expert first.
            </p>
          </div>

          {/* Part 2 — Problems Carly Solves */}
          <div className="space-y-12">
            <h3 className="text-3xl font-light tracking-tight text-center bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
              The problems we solve
            </h3>
            
            <div className="grid md:grid-cols-2 gap-8">
              {[
                {
                  problem: "Too many listings",
                  solution: "We don't just show you everything. We narrow down to what actually makes sense for you — based on how you'll use the car, not just your budget."
                },
                {
                  problem: "Conflicting advice",
                  solution: "Everyone has an opinion. We give you structured guidance that explains trade-offs clearly, so you can decide what matters most to you."
                },
                {
                  problem: "Sales pressure",
                  solution: "Carly doesn't sell cars. We help you understand what you need, then connect you with verified sellers when you're ready — no rush, no tactics."
                },
                {
                  problem: "Fear of regret",
                  solution: "We explain why something fits your situation, so you feel confident in your choice — not just hopeful."
                }
              ].map((item, idx) => (
                <div 
                  key={idx}
                  className="p-6 bg-neutral-50 dark:bg-neutral-900/50 rounded-xl space-y-3 dark:shadow-[0_0_40px_rgba(59,130,246,0.15)] dark:hover:shadow-[0_0_55px_rgba(139,92,246,0.28)] transition-shadow duration-300"
                >
                  <h4 className="text-lg font-medium">{item.problem}</h4>
                  <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    {item.solution}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Part 3 — What Makes Carly Different */}
          <div className="space-y-8 max-w-3xl mx-auto">
            <h3 className="text-3xl font-light tracking-tight text-center">
              What makes Carly different
            </h3>
            
            <div className="space-y-6">
              <div className="p-8 border-l-2 border-neutral-300 dark:border-neutral-700">
                <p className="text-lg leading-relaxed">
                  Carly is a <strong>decision system</strong>, not a listing site. We don&apos;t show you every available car and hope you figure it out. We guide you through understanding what you need, then show you what fits.
                </p>
              </div>
              
              <div className="p-8 border-l-2 border-neutral-300 dark:border-neutral-700">
                <p className="text-lg leading-relaxed">
                  We prioritize <strong>explanations over volume</strong>. Instead of 500 listings with no context, you get clear reasoning about why specific categories, features, or vehicles make sense for your situation.
                </p>
              </div>
              
              <div className="p-8 border-l-2 border-neutral-300 dark:border-neutral-700">
                <p className="text-lg leading-relaxed">
                  We&apos;re built for <strong>clarity, not pressure</strong>. You can explore at your own pace, save your progress, and return when you&apos;re ready. No countdowns, no artificial urgency.
                </p>
              </div>
            </div>
          </div>

          {/* Part 4 — Gentle CTAs */}
          <div className="text-center space-y-6">
            <h3 className="text-2xl font-light tracking-tight">
              Ready to start?
            </h3>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                variant="outline"
                onClick={scrollToHowItHelps}
                className="h-14 px-8 text-base rounded-xl w-full sm:w-auto"
              >
                See how Carly guides you
              </Button>
              
              <Button
                size="lg"
                onClick={handleBrowseClick}
                className="h-14 px-8 text-base rounded-xl w-full sm:w-auto gap-2"
              >
                Explore vehicles with guidance
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

        </div>
      </section>

      {/* Optional: Match Flow Entry */}
      <section className="py-24 px-6 bg-neutral-50 dark:bg-neutral-900/50">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          <h2 className="text-3xl font-light tracking-tight">
            Not sure where to start?
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400">
            Take a quick guided match to understand what fits your needs.
          </p>
          
          <Button
            size="lg"
            variant="outline"
            onClick={() => setShowMatchFlow(true)}
            className="h-14 px-8 text-base rounded-xl"
          >
            Take the quick match
          </Button>
        </div>
      </section>

      {/* Dealer CTA */}
      <section className="py-24 px-6 bg-white dark:bg-neutral-950">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-3xl font-light tracking-tight">
            Build trust. Close better leads.
          </h2>
          <p className="text-lg text-neutral-600 dark:text-neutral-400">
            Carly brings you buyers who've done their homework. They know what they want.
          </p>
          <Link href="/auth/dealer/apply">
            <Button variant="outline" size="lg" className="gap-2">
              Apply as a Dealer
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
