export default function TermsOfUsePage() {
  return (
    <div className="min-h-screen">
      <section className="relative px-8 pt-32 pb-24">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-6xl font-light tracking-tight bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent mb-8 dark:drop-shadow-[0_0_12px_rgba(139,92,246,0.35)]">
            Terms of Use
          </h1>

          <p className="text-base text-neutral-500 dark:text-neutral-400 mb-16">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <div className="space-y-16">
            {/* Agreement */}
            <div>
              <h2 className="text-2xl font-light bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent mb-6">
                Agreement to Terms
              </h2>
              <p className="text-base text-neutral-600 dark:text-neutral-400 leading-relaxed">
                These Terms of Use constitute a legally binding agreement between you and Vynance Technologies Inc. 
                ("Carly," "we," "us," or "our"). By accessing or using Carly, you agree to be bound by these Terms. 
                If you do not agree, do not use our platform.
              </p>
            </div>

            {/* User Accounts */}
            <div>
              <h2 className="text-2xl font-light bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent mb-6">
                User Accounts
              </h2>
              <p className="text-base text-neutral-600 dark:text-neutral-400 leading-relaxed mb-4">
                When you create an account, you agree to:
              </p>
              <ul className="space-y-3 text-base text-neutral-600 dark:text-neutral-400">
                <li className="flex gap-3">
                  <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">•</span>
                  <span>Provide accurate, current, and complete information</span>
                </li>
                <li className="flex gap-3">
                  <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">•</span>
                  <span>Maintain the security of your account credentials</span>
                </li>
                <li className="flex gap-3">
                  <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">•</span>
                  <span>Accept responsibility for all activity under your account</span>
                </li>
                <li className="flex gap-3">
                  <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">•</span>
                  <span>Notify us immediately of any unauthorized access</span>
                </li>
              </ul>
            </div>

            {/* Acceptable Use */}
            <div>
              <h2 className="text-2xl font-light bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent mb-6">
                Acceptable Use
              </h2>
              <p className="text-base text-neutral-600 dark:text-neutral-400 leading-relaxed mb-4">
                You agree not to:
              </p>
              <ul className="space-y-3 text-base text-neutral-600 dark:text-neutral-400">
                <li className="flex gap-3">
                  <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">•</span>
                  <span>Post false, misleading, or fraudulent listings</span>
                </li>
                <li className="flex gap-3">
                  <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">•</span>
                  <span>Harass, abuse, or harm other users</span>
                </li>
                <li className="flex gap-3">
                  <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">•</span>
                  <span>Violate any applicable laws or regulations</span>
                </li>
                <li className="flex gap-3">
                  <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">•</span>
                  <span>Scrape, copy, or automate access to our platform</span>
                </li>
                <li className="flex gap-3">
                  <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">•</span>
                  <span>Circumvent security features or verification processes</span>
                </li>
                <li className="flex gap-3">
                  <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">•</span>
                  <span>Use Carly for any illegal or unauthorized purpose</span>
                </li>
              </ul>
            </div>

            {/* Listings */}
            <div>
              <h2 className="text-2xl font-light bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent mb-6">
                Listings and Transactions
              </h2>
              <p className="text-base text-neutral-600 dark:text-neutral-400 leading-relaxed mb-4">
                Carly is a platform that connects buyers and sellers. We do not own, sell, or guarantee any vehicles listed on our platform.
              </p>
              <ul className="space-y-3 text-base text-neutral-600 dark:text-neutral-400">
                <li className="flex gap-3">
                  <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">•</span>
                  <span>Sellers are responsible for the accuracy of their listings</span>
                </li>
                <li className="flex gap-3">
                  <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">•</span>
                  <span>Buyers are responsible for inspecting vehicles before purchase</span>
                </li>
                <li className="flex gap-3">
                  <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">•</span>
                  <span>All transactions occur directly between buyers and sellers</span>
                </li>
                <li className="flex gap-3">
                  <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">•</span>
                  <span>Carly is not a party to any transaction and assumes no liability</span>
                </li>
              </ul>
            </div>

            {/* Intellectual Property */}
            <div>
              <h2 className="text-2xl font-light bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent mb-6">
                Intellectual Property
              </h2>
              <p className="text-base text-neutral-600 dark:text-neutral-400 leading-relaxed">
                All content on Carly, including text, graphics, logos, and software, is owned by or licensed to 
                Vynance Technologies Inc. and protected by intellectual property laws. You may not copy, reproduce, 
                or distribute any content without our prior written permission.
              </p>
            </div>

            {/* Limitation of Liability */}
            <div>
              <h2 className="text-2xl font-light bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent mb-6">
                Limitation of Liability
              </h2>
              <p className="text-base text-neutral-600 dark:text-neutral-400 leading-relaxed">
                To the fullest extent permitted by law, Vynance Technologies Inc. shall not be liable for any indirect, 
                incidental, special, consequential, or punitive damages arising from your use of Carly. This includes 
                but is not limited to: loss of profits, data, or vehicle value; disputes between buyers and sellers; 
                or any harm resulting from third-party conduct on our platform.
              </p>
            </div>

            {/* Termination */}
            <div>
              <h2 className="text-2xl font-light bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent mb-6">
                Termination
              </h2>
              <p className="text-base text-neutral-600 dark:text-neutral-400 leading-relaxed">
                We reserve the right to suspend or terminate your account at any time, without notice, for violations 
                of these Terms or conduct that harms other users or our platform. You may delete your account at any 
                time through your account settings.
              </p>
            </div>

            {/* Changes to Terms */}
            <div>
              <h2 className="text-2xl font-light bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent mb-6">
                Changes to These Terms
              </h2>
              <p className="text-base text-neutral-600 dark:text-neutral-400 leading-relaxed">
                We may update these Terms from time to time. We will notify you of significant changes via email 
                or through our platform. Continued use of Carly after changes constitutes acceptance of the updated Terms.
              </p>
            </div>

            {/* Contact */}
            <div>
              <h2 className="text-2xl font-light bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent mb-6">
                Contact Us
              </h2>
              <p className="text-base text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Questions about these Terms? Contact us at:
              </p>
              <p className="text-base text-neutral-600 dark:text-neutral-400 mt-4">
                <strong>Vynance Technologies Inc.</strong><br />
                Email: legal@carly.com
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
