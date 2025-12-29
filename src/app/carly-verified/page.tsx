"use client";

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { CheckCircle, Shield, FileCheck } from 'lucide-react';

export default function CarlyVerifiedPage() {
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
          <div className="flex items-center gap-3 mb-8">
            <CheckCircle className="w-8 h-8 text-neutral-900 dark:text-neutral-50" />
            <h1 className="text-6xl font-light tracking-tight bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent dark:drop-shadow-[0_0_12px_rgba(139,92,246,0.35)]">
              Carly Verified
            </h1>
          </div>

          <p className="text-2xl text-neutral-600 dark:text-neutral-400 font-light leading-relaxed mb-16">
            A trust signal that means something — not a marketing badge.
          </p>

          <div className="space-y-24">
            {/* What It Means */}
            <div>
              <h2 className="text-sm uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-6">
                What Carly Verified Means
              </h2>
              <p className="text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed mb-4">
                When you see the Carly Verified badge, it means the listing has been cross-checked, 
                the dealer or seller has been validated, and the information presented is consistent with our standards.
              </p>
              <p className="text-base text-neutral-500 dark:text-neutral-400 leading-relaxed">
                This isn't automatic. It's earned. And it can be revoked if behavior changes.
              </p>
            </div>

            {/* What Gets Verified */}
            <div>
              <h2 className="text-sm uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-6">
                What Gets Verified
              </h2>
              
              <div className="space-y-8">
                <div className="flex gap-4">
                  <Shield className="w-6 h-6 text-neutral-400 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-medium bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent mb-2">
                      Seller Identity
                    </h3>
                    <p className="text-base text-neutral-600 dark:text-neutral-400 leading-relaxed">
                      Dealers and listing owners go through identity verification. 
                      We confirm business registration, contact details, and operational legitimacy.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <FileCheck className="w-6 h-6 text-neutral-400 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-medium bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent mb-2">
                      Vehicle Information
                    </h3>
                    <p className="text-base text-neutral-600 dark:text-neutral-400 leading-relaxed">
                      VINs are decoded and cross-referenced. Photos are checked for consistency. 
                      Mileage, year, make, and model are validated against public records where available.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <CheckCircle className="w-6 h-6 text-neutral-400 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-medium bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent mb-2">
                      Behavior History
                    </h3>
                    <p className="text-base text-neutral-600 dark:text-neutral-400 leading-relaxed">
                      Sellers with a track record of responsiveness, transparency, and professionalism 
                      are prioritized. Repeated complaints or suspicious behavior removes verification.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* What It Doesn't Mean */}
            <div>
              <h2 className="text-sm uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-6">
                What Carly Verified Doesn't Mean
              </h2>
              <p className="text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed mb-6">
                This is not a guarantee of vehicle condition.
              </p>
              <p className="text-base text-neutral-500 dark:text-neutral-400 leading-relaxed mb-4">
                Verification confirms identity and information consistency — not mechanical inspection. 
                Always inspect vehicles in person, request service records, and consider independent inspections 
                before purchasing.
              </p>
              <p className="text-base text-neutral-500 dark:text-neutral-400 leading-relaxed">
                Carly Verified reduces fraud risk and misinformation. It doesn't replace due diligence.
              </p>
            </div>

            {/* How to Get Verified */}
            <div>
              <h2 className="text-sm uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-6">
                How Sellers Get Verified
              </h2>
              <p className="text-base text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Verification is granted after identity validation, listing review, and behavioral assessment. 
                Sellers cannot pay for verification. It's earned through transparency and reliability.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-8 py-24 bg-neutral-50 dark:bg-neutral-900/50">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-2xl font-light bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent leading-relaxed">
            Trust should be demonstrated, not claimed.
          </p>
        </div>
      </section>
    </div>
  );
}
