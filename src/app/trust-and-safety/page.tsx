"use client";

import { Shield, Eye, MessageSquare, AlertTriangle, CheckCircle, Lock } from 'lucide-react';

export default function TrustAndSafetyPage() {
  return (
    <div className="min-h-screen">
      <section className="relative px-8 pt-32 pb-24">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Shield className="w-8 h-8 text-neutral-900 dark:text-neutral-50" />
            <h1 className="text-6xl font-light tracking-tight bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent dark:drop-shadow-[0_0_12px_rgba(139,92,246,0.35)]">
              Trust & Safety
            </h1>
          </div>

          <p className="text-2xl text-neutral-600 dark:text-neutral-400 font-light leading-relaxed mb-16">
            How Carly protects buyers and sellers through verification, transparency, and accountability.
          </p>

          <div className="space-y-24">
            {/* Verification */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <CheckCircle className="w-6 h-6 text-neutral-400" />
                <h2 className="text-3xl font-light bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                  Verification System
                </h2>
              </div>
              <p className="text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed mb-4">
                Carly Verified is not automatic — it's earned.
              </p>
              <p className="text-base text-neutral-500 dark:text-neutral-400 leading-relaxed mb-4">
                Sellers undergo identity validation, listing review, and behavioral assessment. 
                Verification can be revoked if standards aren't maintained. This ensures the badge means something.
              </p>
              <p className="text-base text-neutral-500 dark:text-neutral-400 leading-relaxed">
                Buyers can trust that verified listings come from legitimate, accountable sellers.
              </p>
            </div>

            {/* Reputation */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <Eye className="w-6 h-6 text-neutral-400" />
                <h2 className="text-3xl font-light bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                  Reputation Tracking
                </h2>
              </div>
              <p className="text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed mb-4">
                Every seller has a reputation history visible to buyers.
              </p>
              <p className="text-base text-neutral-500 dark:text-neutral-400 leading-relaxed">
                This includes: response time, transparency, buyer feedback, and completed transactions. 
                Reputation is not gamed through fake reviews — it's built through consistent, professional behavior. 
                Patterns of poor conduct result in reduced visibility or account suspension.
              </p>
            </div>

            {/* Secure Messaging */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <MessageSquare className="w-6 h-6 text-neutral-400" />
                <h2 className="text-3xl font-light bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                  Secure Messaging
                </h2>
              </div>
              <p className="text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed mb-4">
                All communication happens through Carly's platform.
              </p>
              <p className="text-base text-neutral-500 dark:text-neutral-400 leading-relaxed mb-4">
                Your contact information stays private unless you choose to share it. 
                Messages are monitored for suspicious behavior. Spam, harassment, and phishing attempts are flagged and acted upon.
              </p>
              <p className="text-base text-neutral-500 dark:text-neutral-400 leading-relaxed">
                Buyers control the pace of communication. You can disengage at any time without pressure.
              </p>
            </div>

            {/* Privacy Protection */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <Lock className="w-6 h-6 text-neutral-400" />
                <h2 className="text-3xl font-light bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                  Privacy Protection
                </h2>
              </div>
              <p className="text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed mb-4">
                Your data is not sold or shared with third parties for marketing.
              </p>
              <p className="text-base text-neutral-500 dark:text-neutral-400 leading-relaxed">
                We collect only what's necessary to operate the platform and improve your experience. 
                Browsing is private. Saved vehicles are private. You decide when and how to engage with sellers. 
                Read our full <a href="/privacy-policy" className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent underline hover:opacity-70 transition-colors">Privacy Policy</a> for details.
              </p>
            </div>

            {/* Reporting System */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <AlertTriangle className="w-6 h-6 text-neutral-400" />
                <h2 className="text-3xl font-light bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                  Reporting & Enforcement
                </h2>
              </div>
              <p className="text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed mb-4">
                If you encounter fraud, harassment, or misleading listings, report it immediately.
              </p>
              <p className="text-base text-neutral-500 dark:text-neutral-400 leading-relaxed mb-4">
                Every report is reviewed. Action is taken based on severity and evidence. 
                Repeated violations result in account suspension or permanent removal.
              </p>
              <p className="text-base text-neutral-500 dark:text-neutral-400 leading-relaxed">
                <a href="/report-issue" className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent underline hover:opacity-70 transition-colors">Report an issue</a> if you see something that doesn't belong on Carly.
              </p>
            </div>

            {/* Buyer Best Practices */}
            <div>
              <h2 className="text-sm uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-6">
                Buyer Best Practices
              </h2>
              <p className="text-base text-neutral-600 dark:text-neutral-400 leading-relaxed mb-4">
                While Carly provides trust infrastructure, buyers should always:
              </p>
              <ul className="space-y-3 text-base text-neutral-600 dark:text-neutral-400">
                <li className="flex gap-3">
                  <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">•</span>
                  <span>Inspect vehicles in person before purchasing</span>
                </li>
                <li className="flex gap-3">
                  <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">•</span>
                  <span>Request service records and vehicle history reports</span>
                </li>
                <li className="flex gap-3">
                  <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">•</span>
                  <span>Consider independent mechanical inspections</span>
                </li>
                <li className="flex gap-3">
                  <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">•</span>
                  <span>Verify VINs match documentation</span>
                </li>
                <li className="flex gap-3">
                  <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">•</span>
                  <span>Never wire money or pay outside secure channels</span>
                </li>
                <li className="flex gap-3">
                  <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">•</span>
                  <span>Trust your instincts — if something feels wrong, walk away</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="px-8 py-24 bg-neutral-50 dark:bg-neutral-900/50">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-2xl font-light text-neutral-900 dark:text-neutral-50 leading-relaxed bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text dark:text-transparent">
            Trust is earned through transparency, accountability, and consistent action.
          </p>
        </div>
      </section>
    </div>
  );
}
