"use client";

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { CheckCircle, ArrowRight, Lock, Shield, UserCheck, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';

const CURATED_CATEGORIES = [
  'Vintage & Heritage Vehicles',
  'Collector & Limited Production',
  'Coachbuilt & Bespoke',
  'Performance Icons',
  'Design & Engineering Milestones',
  'Private Collection Releases',
];

export default function LuxuryPage() {
  const { user, isUnauthenticated } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Redirect dealers away from this page
  if (user?.role === 'dealer') {
    router.push('/dealer');
    return null;
  }

  const handleAccessRequest = () => {
    // Mock early access submission
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative px-8 pt-32 pb-24">
        <div className="max-w-5xl mx-auto">
          <p className="text-sm uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-8">
            Carly Luxury
          </p>

          <h1 className="text-6xl font-light tracking-tight bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent mb-6 dark:drop-shadow-[0_0_12px_rgba(139,92,246,0.35)]">
            A private market layer.<br />Controlled access.<br />Selective visibility.
          </h1>

          <p className="text-xl text-neutral-600 dark:text-neutral-400 font-light leading-relaxed max-w-2xl mb-12">
            Carly Luxury is not a public marketplace. Access is earned, not requested.
          </p>

          <div className="flex gap-4 items-center">
            <Button
              onClick={handleAccessRequest}
              disabled={submitted && isUnauthenticated}
              className="h-12 px-8 text-base"
            >
              {submitted && isUnauthenticated ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Request Submitted
                </>
              ) : (
                'Request Consideration'
              )}
            </Button>
            <Button variant="ghost" className="text-base" onClick={() => {
              document.getElementById('what-is')?.scrollIntoView({ behavior: 'smooth' });
            }}>
              Learn More
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* What Defines Carly Luxury */}
      <section id="what-is" className="px-8 py-24 bg-neutral-50 dark:bg-neutral-900/50">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-sm uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-12">
            Private Access Layer
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="p-8 bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800">
              <Lock className="w-8 h-8 text-neutral-400 dark:text-neutral-600 mb-4" />
              <h4 className="text-xl font-medium text-neutral-900 dark:text-neutral-50 mb-3">
                Private Listings
              </h4>
              <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Inventory is never publicly indexed. Shared selectively.
              </p>
            </Card>

            <Card className="p-8 bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800">
              <UserCheck className="w-8 h-8 text-neutral-400 dark:text-neutral-600 mb-4" />
              <h4 className="text-xl font-medium text-neutral-900 dark:text-neutral-50 mb-3">
                Invitation-Only Access
              </h4>
              <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Vehicles are released through private invitations, not open marketplaces.
              </p>
            </Card>

            <Card className="p-8 bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800">
              <Shield className="w-8 h-8 text-neutral-400 dark:text-neutral-600 mb-4" />
              <h4 className="text-xl font-medium text-neutral-900 dark:text-neutral-50 mb-3">
                Verified Sellers Only
              </h4>
              <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Enhanced screening, identity checks, and reputation thresholds.
              </p>
            </Card>

            <Card className="p-8 bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800">
              <Eye className="w-8 h-8 text-neutral-400 dark:text-neutral-600 mb-4" />
              <h4 className="text-xl font-medium text-neutral-900 dark:text-neutral-50 mb-3">
                Reputation-Weighted Visibility
              </h4>
              <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Access improves based on behavior, intent, and history.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Curated Categories */}
      <section className="px-8 py-16">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-sm uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-8">
            Curated Collections
          </h3>
          
          <div className="overflow-x-auto">
            <div className="flex gap-4 pb-4">
              {CURATED_CATEGORIES.map((category) => (
                <Card 
                  key={category}
                  className="flex-shrink-0 w-80 p-6 bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors cursor-pointer"
                >
                  <h4 className="text-lg font-medium text-neutral-900 dark:text-neutral-50 mb-2">
                    {category}
                  </h4>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    Access-controlled inventory
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How Access Works */}
      <section className="px-8 py-24 bg-neutral-50 dark:bg-neutral-900/50">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-sm uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-12">
            How Access Works
          </h3>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center text-sm font-medium text-neutral-600 dark:text-neutral-400 shrink-0">
                1
              </div>
              <div>
                <h4 className="text-lg font-medium text-neutral-900 dark:text-neutral-50 mb-2">
                  Verify identity
                </h4>
                <p className="text-neutral-600 dark:text-neutral-400">
                  Complete profile verification to establish intent and eligibility
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center text-sm font-medium text-neutral-600 dark:text-neutral-400 shrink-0">
                2
              </div>
              <div>
                <h4 className="text-lg font-medium text-neutral-900 dark:text-neutral-50 mb-2">
                  Build reputation
                </h4>
                <p className="text-neutral-600 dark:text-neutral-400">
                  Demonstrate serious intent through platform behavior
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center text-sm font-medium text-neutral-600 dark:text-neutral-400 shrink-0">
                3
              </div>
              <div>
                <h4 className="text-lg font-medium text-neutral-900 dark:text-neutral-50 mb-2">
                  Receive private invitations
                </h4>
                <p className="text-neutral-600 dark:text-neutral-400">
                  Gain visibility into controlled inventory as access expands
                </p>
              </div>
            </div>
          </div>

          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-12 italic">
            Access is granted, not guaranteed.
          </p>
        </div>
      </section>

      {/* Access Request */}
      <section className="px-8 py-24">
        <div className="max-w-2xl mx-auto text-center">
          <h3 className="text-3xl font-light tracking-tight text-neutral-900 dark:text-neutral-50 mb-6">
            Request consideration for access
          </h3>

          {user ? (
            // Logged-in buyer
            <Button
              onClick={handleAccessRequest}
              disabled={submitted}
              size="lg"
              className="h-14 px-12 text-base"
            >
              {submitted ? (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Request received
                </>
              ) : (
                'Submit access request'
              )}
            </Button>
          ) : (
            // Logged-out user
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 h-14 px-4 text-base"
                disabled={submitted}
              />
              <Button
                onClick={handleAccessRequest}
                disabled={!email || submitted}
                size="lg"
                className="h-14 px-8 text-base"
              >
                {submitted ? (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Submitted
                  </>
                ) : (
                  'Submit Request'
                )}
              </Button>
            </div>
          )}

          {submitted && (
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-6">
              We will review your request.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
