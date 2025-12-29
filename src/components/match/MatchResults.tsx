'use client';

import { Button } from '@/components/ui/button';
import { ArrowRight, Bell, Sparkles } from 'lucide-react';
import { MatchProfile } from './MatchFlow';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface MatchResultsProps {
  profile: MatchProfile;
  onCreateAccount: () => void;
  onContinueWithoutAccount: () => void;
}

type VehicleCategory = {
  name: string;
  description: string;
  whyItFits: string;
  examples: string[];
};

export function MatchResults({ profile, onCreateAccount, onContinueWithoutAccount }: MatchResultsProps) {
  
  const getProfileSummary = (): string => {
    const summaries: Record<string, string> = {
      'browsing': "You're exploring options without pressure — we'll focus on building your understanding of what's possible.",
      'replacing': "You're looking for a reliable replacement that improves on what you have now.",
      'first': "This is a big decision — we'll emphasize safety, value, and confidence-building.",
      'life-change': "Your needs have evolved — we'll help you find something that fits your new situation.",
      'know-what': "You have clarity — we'll help you find the right match and validate your choice.",
    };

    return summaries[profile.intent] || "Based on your answers, we're building a personalized profile for you.";
  };

  const getRecommendedCategories = (): VehicleCategory[] => {
    const hasCommute = profile.lifestyle.includes('Daily commuting');
    const hasFamily = profile.lifestyle.includes('Family / passengers');
    const hasHauling = profile.lifestyle.includes('Work / hauling gear');
    const prioritizeComfort = profile.comfortVsCapability < 50;
    const prioritizeCapability = profile.comfortVsCapability > 50;

    const categories: VehicleCategory[] = [];

    // Logic for category matching
    if (prioritizeComfort && (hasCommute || profile.lifestyle.includes('Mostly city driving'))) {
      categories.push({
        name: 'Compact Sedans & Hatchbacks',
        description: 'Fuel-efficient, easy to park, smooth for daily driving',
        whyItFits: 'You prioritized comfort and have city/commute needs',
        examples: ['Honda Civic', 'Toyota Corolla', 'Mazda3']
      });
    }

    if (hasFamily || profile.lifestyle.includes('Weekend trips')) {
      categories.push({
        name: 'Compact SUVs & Crossovers',
        description: 'Versatile, spacious, elevated driving position',
        whyItFits: hasFamily 
          ? 'You mentioned family/passengers — extra space helps'
          : 'Weekend trips benefit from cargo flexibility',
        examples: ['Honda CR-V', 'Toyota RAV4', 'Mazda CX-5']
      });
    }

    if (prioritizeCapability || hasHauling) {
      categories.push({
        name: 'Midsize SUVs & Trucks',
        description: 'Towing, hauling, adventure-ready capability',
        whyItFits: hasHauling
          ? 'You need work/hauling capability'
          : 'You prioritized capability over comfort',
        examples: ['Ford F-150', 'Toyota Tacoma', 'Jeep Grand Cherokee']
      });
    }

    // Fallback categories if none match
    if (categories.length === 0) {
      categories.push({
        name: 'Midsize Sedans',
        description: 'Balanced comfort, space, and reliability',
        whyItFits: 'A safe middle ground for most needs',
        examples: ['Honda Accord', 'Toyota Camry', 'Subaru Legacy']
      });
      categories.push({
        name: 'Compact SUVs',
        description: 'Popular choice with broad appeal',
        whyItFits: 'Versatile enough for most lifestyles',
        examples: ['Honda CR-V', 'Toyota RAV4', 'Mazda CX-5']
      });
    }

    return categories.slice(0, 3); // Max 3 categories
  };

  const profileSummary = getProfileSummary();
  const categories = getRecommendedCategories();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-neutral-50 dark:from-neutral-950 dark:to-neutral-900">
      <div className="max-w-4xl mx-auto px-6 py-16">
        
        {/* Header */}
        <div className="text-center space-y-4 mb-16 animate-in fade-in slide-in-from-top-2 duration-500">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-neutral-900 rounded-full">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">Match complete</span>
          </div>
          <h1 className="text-4xl font-light tracking-tight">
            Here's what we're seeing
          </h1>
          <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
            {profileSummary}
          </p>
        </div>

        {/* Categories */}
        <div className="space-y-6 mb-16 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-150">
          {categories.map((category, idx) => (
            <div
              key={idx}
              className="p-6 bg-card/80 backdrop-blur-sm border border-neutral-200 dark:border-neutral-800 rounded-xl hover:border-neutral-300 dark:hover:border-neutral-700 transition-all duration-200"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <h3 className="text-xl font-medium mb-1">{category.name}</h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    {category.description}
                  </p>
                </div>
                <div className="flex-shrink-0 px-3 py-1 bg-neutral-100 dark:bg-neutral-800 rounded-full text-xs font-medium whitespace-nowrap">
                  {idx === 0 ? 'Best fit' : 'Also consider'}
                </div>
              </div>
              
              <div className="p-3 bg-neutral-50 dark:bg-neutral-900/50 rounded-lg mb-3">
                <p className="text-sm">
                  <span className="font-medium">Why this fits you:</span>{' '}
                  <span className="text-neutral-600 dark:text-neutral-400">{category.whyItFits}</span>
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {category.examples.map(example => (
                  <span
                    key={example}
                    className="px-3 py-1 bg-neutral-100 dark:bg-neutral-800 rounded-full text-xs"
                  >
                    {example}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Save Progress CTA */}
        <div className="border-t border-neutral-200 dark:border-neutral-800 pt-12 animate-in fade-in duration-500 delay-300">
          <div className="text-center space-y-6">
            <div className="space-y-3">
              <h2 className="text-2xl font-light tracking-tight">
                Want us to save this and personalize your experience?
              </h2>
              <p className="text-neutral-600 dark:text-neutral-400 max-w-xl mx-auto">
                Create an account to get notified when vehicles match your profile, 
                save your preferences, and see better recommendations over time.
              </p>
            </div>

            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Button
                onClick={onCreateAccount}
                size="lg"
                className="gap-2 min-w-[200px]"
              >
                Create account & save
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button
                onClick={onContinueWithoutAccount}
                variant="outline"
                size="lg"
                className="gap-2 min-w-[200px]"
              >
                Continue without saving
              </Button>
            </div>

            {/* Benefits list */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto mt-8">
              {[
                { icon: Bell, text: 'Get notified when vehicles match you' },
                { icon: Sparkles, text: 'See better recommendations over time' },
              ].map((benefit, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-4 bg-neutral-50 dark:bg-neutral-900/50 rounded-lg"
                >
                  <benefit.icon className="w-5 h-5 text-neutral-500" />
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">
                    {benefit.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
