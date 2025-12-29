'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export type MatchProfile = {
  intent: string;
  lifestyle: string[];
  comfortVsCapability: number;
  budget: string;
  ownershipStyle: string;
};

interface MatchFlowProps {
  onComplete: (profile: MatchProfile) => void;
  onClose: () => void;
}

export function MatchFlow({ onComplete, onClose }: MatchFlowProps) {
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<MatchProfile>({
    intent: '',
    lifestyle: [],
    comfortVsCapability: 50,
    budget: '',
    ownershipStyle: '',
  });

  const totalSteps = 5;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      onComplete(profile);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return profile.intent !== '';
      case 2:
        return profile.lifestyle.length > 0;
      case 3:
        return true; // Always can proceed from slider
      case 4:
        return profile.budget !== '';
      case 5:
        return profile.ownershipStyle !== '';
      default:
        return false;
    }
  };

  const toggleLifestyle = (option: string) => {
    setProfile(prev => ({
      ...prev,
      lifestyle: prev.lifestyle.includes(option)
        ? prev.lifestyle.filter(item => item !== option)
        : [...prev.lifestyle, option]
    }));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 border-b border-neutral-200 dark:border-neutral-800">
          <div className="max-w-2xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-neutral-500">
                Step {step} of {totalSteps}
              </div>
              <button
                onClick={onClose}
                className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
              >
                Close
              </button>
            </div>
            {/* Progress bar */}
            <div className="mt-4 h-1 bg-neutral-100 dark:bg-neutral-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-neutral-900 dark:bg-neutral-100 transition-all duration-500 ease-out"
                style={{ width: `${(step / totalSteps) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-2xl">
            <div className="animate-in fade-in slide-in-from-top-2 duration-500">
              
              {/* Step 1 - Intent */}
              {step === 1 && (
                <div className="space-y-8">
                  <div className="space-y-3 text-center">
                    <h2 className="text-3xl font-light tracking-tight">
                      What best describes why you're here today?
                    </h2>
                    <p className="text-sm text-neutral-500">
                      This helps us understand what matters most
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-3 max-w-lg mx-auto">
                    {[
                      { value: 'browsing', label: 'Just browsing / exploring' },
                      { value: 'replacing', label: 'Replacing my current car' },
                      { value: 'first', label: 'First car or big upgrade' },
                      { value: 'life-change', label: 'Something changed (job, family, move)' },
                      { value: 'know-what', label: 'I know what I want' },
                    ].map(option => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setProfile({ ...profile, intent: option.value })}
                        className={cn(
                          'px-6 py-4 text-left rounded-lg border-2 transition-all duration-200',
                          'hover:border-neutral-400 dark:hover:border-neutral-600',
                          profile.intent === option.value
                            ? 'border-neutral-900 dark:border-neutral-100 bg-neutral-50 dark:bg-neutral-900'
                            : 'border-neutral-200 dark:border-neutral-800'
                        )}
                      >
                        <span className="font-medium">{option.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2 - Lifestyle Fit */}
              {step === 2 && (
                <div className="space-y-8">
                  <div className="space-y-3 text-center">
                    <h2 className="text-3xl font-light tracking-tight">
                      How will this car fit into your life?
                    </h2>
                    <p className="text-sm text-neutral-500">
                      Select all that apply — helps us prioritize features
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
                    {[
                      'Daily commuting',
                      'Family / passengers',
                      'Weekend trips',
                      'Work / hauling gear',
                      'Mostly city driving',
                      'Mostly highway driving',
                    ].map(option => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => toggleLifestyle(option)}
                        className={cn(
                          'px-6 py-4 text-left rounded-lg border-2 transition-all duration-200',
                          'hover:border-neutral-400 dark:hover:border-neutral-600',
                          'flex items-center justify-between',
                          profile.lifestyle.includes(option)
                            ? 'border-neutral-900 dark:border-neutral-100 bg-neutral-50 dark:bg-neutral-900'
                            : 'border-neutral-200 dark:border-neutral-800'
                        )}
                      >
                        <span className="font-medium">{option}</span>
                        {profile.lifestyle.includes(option) && (
                          <Check className="w-5 h-5" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3 - Comfort vs Capability */}
              {step === 3 && (
                <div className="space-y-8">
                  <div className="space-y-3 text-center">
                    <h2 className="text-3xl font-light tracking-tight">
                      What matters more right now?
                    </h2>
                    <p className="text-sm text-neutral-500">
                      There's no right answer — this just helps us prioritize
                    </p>
                  </div>

                  <div className="max-w-xl mx-auto space-y-8">
                    <div className="space-y-6">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={profile.comfortVsCapability}
                        onChange={(e) => setProfile({ ...profile, comfortVsCapability: parseInt(e.target.value) })}
                        className="w-full h-2 bg-neutral-200 dark:bg-neutral-800 rounded-lg appearance-none cursor-pointer slider"
                      />
                      
                      <div className="flex items-center justify-between text-sm">
                        <div className={cn(
                          'text-center transition-all duration-300',
                          profile.comfortVsCapability < 50 ? 'font-semibold scale-105' : 'text-neutral-500'
                        )}>
                          <div>Comfort & ease</div>
                          <div className="text-xs mt-1">Smooth, efficient, predictable</div>
                        </div>
                        <div className={cn(
                          'text-center transition-all duration-300',
                          profile.comfortVsCapability > 50 ? 'font-semibold scale-105' : 'text-neutral-500'
                        )}>
                          <div>Capability & space</div>
                          <div className="text-xs mt-1">Hauling, towing, adventure</div>
                        </div>
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="inline-block px-4 py-2 bg-neutral-100 dark:bg-neutral-900 rounded-lg">
                        <span className="text-sm font-medium">
                          {profile.comfortVsCapability < 33 ? 'Prioritizing comfort' :
                           profile.comfortVsCapability > 66 ? 'Prioritizing capability' :
                           'Balanced approach'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4 - Budget */}
              {step === 4 && (
                <div className="space-y-8">
                  <div className="space-y-3 text-center">
                    <h2 className="text-3xl font-light tracking-tight">
                      What feels comfortable monthly?
                    </h2>
                    <p className="text-sm text-neutral-500">
                      We'll adjust for financing, leasing, or cash
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-3 max-w-lg mx-auto">
                    {[
                      { value: 'under-300', label: 'Under $300' },
                      { value: '300-450', label: '$300–$450' },
                      { value: '450-600', label: '$450–$600' },
                      { value: '600-plus', label: '$600+' },
                      { value: 'not-sure', label: 'Not sure yet' },
                    ].map(option => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setProfile({ ...profile, budget: option.value })}
                        className={cn(
                          'px-6 py-4 text-left rounded-lg border-2 transition-all duration-200',
                          'hover:border-neutral-400 dark:hover:border-neutral-600',
                          profile.budget === option.value
                            ? 'border-neutral-900 dark:border-neutral-100 bg-neutral-50 dark:bg-neutral-900'
                            : 'border-neutral-200 dark:border-neutral-800'
                        )}
                      >
                        <span className="font-medium text-lg">{option.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 5 - Ownership Style */}
              {step === 5 && (
                <div className="space-y-8">
                  <div className="space-y-3 text-center">
                    <h2 className="text-3xl font-light tracking-tight">
                      How do you feel about ownership?
                    </h2>
                    <p className="text-sm text-neutral-500">
                      This affects what we recommend
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-3 max-w-lg mx-auto">
                    {[
                      { value: 'predictable', label: 'Predictable & reliable', sub: 'Low maintenance, proven models' },
                      { value: 'value', label: 'Trade-offs for value', sub: 'Older or higher mileage is fine' },
                      { value: 'performance', label: 'Performance / personality', sub: 'Willing to pay for character' },
                      { value: 'guide-me', label: 'Not sure — guide me', sub: 'Help me understand the options' },
                    ].map(option => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setProfile({ ...profile, ownershipStyle: option.value })}
                        className={cn(
                          'px-6 py-4 text-left rounded-lg border-2 transition-all duration-200',
                          'hover:border-neutral-400 dark:hover:border-neutral-600',
                          profile.ownershipStyle === option.value
                            ? 'border-neutral-900 dark:border-neutral-100 bg-neutral-50 dark:bg-neutral-900'
                            : 'border-neutral-200 dark:border-neutral-800'
                        )}
                      >
                        <div className="font-medium">{option.label}</div>
                        <div className="text-sm text-neutral-500 mt-1">{option.sub}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t border-neutral-200 dark:border-neutral-800">
          <div className="max-w-2xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between gap-4">
              <Button
                variant="ghost"
                onClick={handleBack}
                disabled={step === 1}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>

              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="gap-2 min-w-[140px]"
              >
                {step === totalSteps ? 'See Results' : 'Continue'}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
