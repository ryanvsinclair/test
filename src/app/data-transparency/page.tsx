export default function DataTransparencyPage() {
  return (
    <div className="min-h-screen">
      <section className="relative px-8 pt-32 pb-24">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-6xl font-light tracking-tight bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent mb-8 dark:drop-shadow-[0_0_12px_rgba(139,92,246,0.35)]">
            Data & Transparency
          </h1>

          <p className="text-2xl text-neutral-600 dark:text-neutral-400 font-light leading-relaxed mb-16">
            Plain-language explanations of how Carly collects, uses, and protects your data.
          </p>

          <div className="space-y-16">
            {/* What We Collect */}
            <div>
              <h2 className="text-sm uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-6">
                What We Collect
              </h2>
              <p className="text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed mb-6">
                We collect only what's necessary to make Carly work.
              </p>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-medium bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent mb-2">
                    Account Information
                  </h3>
                  <p className="text-base text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    Your email, password, and profile details. Used to create and maintain your account.
                  </p>
                </div>

                <div>
                  <h3 className="text-base font-medium bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent mb-2">
                    Browsing Behavior
                  </h3>
                  <p className="text-base text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    What vehicles you view, save, and compare. Used to improve recommendations and personalize your experience. 
                    This data is never sold or shared with advertisers.
                  </p>
                </div>

                <div>
                  <h3 className="text-base font-medium bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent mb-2">
                    Messages
                  </h3>
                  <p className="text-base text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    Communication between you and sellers. Stored securely and monitored only for trust and safety purposes 
                    (e.g., detecting fraud or harassment).
                  </p>
                </div>

                <div>
                  <h3 className="text-base font-medium bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent mb-2">
                    Technical Data
                  </h3>
                  <p className="text-base text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    Device type, browser, IP address, and usage logs. Used to maintain platform security, 
                    diagnose technical issues, and prevent abuse.
                  </p>
                </div>
              </div>
            </div>

            {/* Why We Collect It */}
            <div>
              <h2 className="text-sm uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-6">
                Why We Collect It
              </h2>
              <ul className="space-y-4 text-base text-neutral-600 dark:text-neutral-400">
                <li className="flex gap-3">
                  <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">•</span>
                  <span><strong>To improve recommendations:</strong> Your browsing patterns help Carly surface vehicles that fit your needs</span>
                </li>
                <li className="flex gap-3">
                  <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">•</span>
                  <span><strong>To enable communication:</strong> Messaging requires storing and delivering your messages</span>
                </li>
                <li className="flex gap-3">
                  <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">•</span>
                  <span><strong>To prevent fraud:</strong> Behavior monitoring helps detect and stop suspicious activity</span>
                </li>
                <li className="flex gap-3">
                  <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">•</span>
                  <span><strong>To maintain security:</strong> Technical data helps protect your account from unauthorized access</span>
                </li>
                <li className="flex gap-3">
                  <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">•</span>
                  <span><strong>To improve the platform:</strong> Usage patterns inform product decisions and bug fixes</span>
                </li>
              </ul>
            </div>

            {/* What We Don't Do */}
            <div>
              <h2 className="text-sm uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-6">
                What We Don't Do
              </h2>
              <ul className="space-y-4 text-base text-neutral-600 dark:text-neutral-400">
                <li className="flex gap-3">
                  <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">•</span>
                  <span><strong>Sell your data:</strong> We do not sell personal information to advertisers, data brokers, or third parties</span>
                </li>
                <li className="flex gap-3">
                  <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">•</span>
                  <span><strong>Track you across the web:</strong> Carly does not follow you to other websites or apps</span>
                </li>
                <li className="flex gap-3">
                  <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">•</span>
                  <span><strong>Share without consent:</strong> Your contact information is never shared with sellers unless you choose to</span>
                </li>
                <li className="flex gap-3">
                  <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">•</span>
                  <span><strong>Use dark patterns:</strong> We don't manipulate you into sharing more data than necessary</span>
                </li>
              </ul>
            </div>

            {/* Third Parties */}
            <div>
              <h2 className="text-sm uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-6">
                Third-Party Services
              </h2>
              <p className="text-base text-neutral-600 dark:text-neutral-400 leading-relaxed mb-4">
                Carly uses trusted third-party services to operate:
              </p>
              <ul className="space-y-3 text-base text-neutral-600 dark:text-neutral-400">
                <li className="flex gap-3">
                  <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">•</span>
                  <span><strong>Cloud hosting:</strong> For infrastructure and data storage</span>
                </li>
                <li className="flex gap-3">
                  <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">•</span>
                  <span><strong>Analytics:</strong> For understanding platform usage (anonymized where possible)</span>
                </li>
                <li className="flex gap-3">
                  <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">•</span>
                  <span><strong>Payment processing:</strong> For secure transaction handling (if applicable)</span>
                </li>
              </ul>
              <p className="text-base text-neutral-500 dark:text-neutral-400 leading-relaxed mt-4">
                These providers are contractually bound to protect your data and use it only for their stated purpose.
              </p>
            </div>

            {/* Your Control */}
            <div>
              <h2 className="text-sm uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-6">
                Your Control Over Data
              </h2>
              <p className="text-base text-neutral-600 dark:text-neutral-400 leading-relaxed mb-4">
                You can:
              </p>
              <ul className="space-y-3 text-base text-neutral-600 dark:text-neutral-400">
                <li className="flex gap-3">
                  <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">•</span>
                  <span>View and update your account information at any time</span>
                </li>
                <li className="flex gap-3">
                  <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">•</span>
                  <span>Request a copy of your data through account settings</span>
                </li>
                <li className="flex gap-3">
                  <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">•</span>
                  <span>Delete your account and all associated data</span>
                </li>
                <li className="flex gap-3">
                  <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">•</span>
                  <span>Opt out of non-essential data collection</span>
                </li>
                <li className="flex gap-3">
                  <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">•</span>
                  <span>Contact us with questions or data requests</span>
                </li>
              </ul>
            </div>

            {/* Updates */}
            <div>
              <h2 className="text-sm uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-6">
                Policy Updates
              </h2>
              <p className="text-base text-neutral-600 dark:text-neutral-400 leading-relaxed">
                If our data practices change significantly, we'll notify you via email and through the platform. 
                You'll always have the option to review changes before they take effect. Continued use of Carly 
                after updates means you accept the new terms.
              </p>
            </div>

            {/* Contact */}
            <div>
              <h2 className="text-sm uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-6">
                Questions About Your Data?
              </h2>
              <p className="text-base text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Contact us at privacy@carly.com or read our full{' '}
                <a href="/privacy-policy" className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent underline hover:opacity-70 transition-colors">
                  Privacy Policy
                </a>.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
