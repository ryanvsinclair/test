export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen">
      <section className="relative px-8 pt-32 pb-24">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-6xl font-light tracking-tight bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent mb-8 dark:drop-shadow-[0_0_12px_rgba(139,92,246,0.35)]">
            Privacy Policy
          </h1>

          <p className="text-base text-neutral-500 dark:text-neutral-400 mb-16">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <div className="space-y-16">
            {/* Introduction */}
            <div>
              <h2 className="text-2xl font-light bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent mb-6">
                Introduction
              </h2>
              <p className="text-base text-neutral-600 dark:text-neutral-400 leading-relaxed mb-4">
                Vynance Technologies Inc. ("Carly," "we," "us," or "our") is committed to protecting your privacy. 
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.
              </p>
              <p className="text-base text-neutral-500 dark:text-neutral-400 leading-relaxed">
                By using Carly, you agree to the collection and use of information in accordance with this policy.
              </p>
            </div>

            {/* Information We Collect */}
            <div>
              <h2 className="text-2xl font-light bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent mb-6">
                Information We Collect
              </h2>
              
              <h3 className="text-lg font-medium bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent mb-4">
                Information You Provide
              </h3>
              <ul className="space-y-3 text-base text-neutral-600 dark:text-neutral-400 mb-6">
                <li className="flex gap-3">
                  <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">•</span>
                  <span>Account information (email, name, password)</span>
                </li>
                <li className="flex gap-3">
                  <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">•</span>
                  <span>Profile information (location, preferences)</span>
                </li>
                <li className="flex gap-3">
                  <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">•</span>
                  <span>Messages sent through our platform</span>
                </li>
                <li className="flex gap-3">
                  <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">•</span>
                  <span>Vehicle listings (for sellers/dealers)</span>
                </li>
              </ul>

              <h3 className="text-lg font-medium bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent mb-4">
                Information We Collect Automatically
              </h3>
              <ul className="space-y-3 text-base text-neutral-600 dark:text-neutral-400">
                <li className="flex gap-3">
                  <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">•</span>
                  <span>Usage data (pages viewed, features used, time spent)</span>
                </li>
                <li className="flex gap-3">
                  <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">•</span>
                  <span>Device information (browser type, operating system)</span>
                </li>
                <li className="flex gap-3">
                  <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">•</span>
                  <span>Log data (IP address, access times)</span>
                </li>
                <li className="flex gap-3">
                  <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">•</span>
                  <span>Cookies and similar tracking technologies</span>
                </li>
              </ul>
            </div>

            {/* How We Use Your Information */}
            <div>
              <h2 className="text-2xl font-light bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent mb-6">
                How We Use Your Information
              </h2>
              <ul className="space-y-3 text-base text-neutral-600 dark:text-neutral-400">
                <li className="flex gap-3">
                  <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">•</span>
                  <span>Provide and maintain our services</span>
                </li>
                <li className="flex gap-3">
                  <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">•</span>
                  <span>Personalize your experience and improve recommendations</span>
                </li>
                <li className="flex gap-3">
                  <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">•</span>
                  <span>Facilitate communication between buyers and sellers</span>
                </li>
                <li className="flex gap-3">
                  <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">•</span>
                  <span>Verify user identity and prevent fraud</span>
                </li>
                <li className="flex gap-3">
                  <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">•</span>
                  <span>Send important updates and notifications</span>
                </li>
                <li className="flex gap-3">
                  <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">•</span>
                  <span>Analyze usage patterns to improve our platform</span>
                </li>
                <li className="flex gap-3">
                  <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">•</span>
                  <span>Comply with legal obligations</span>
                </li>
              </ul>
            </div>

            {/* Data Sharing */}
            <div>
              <h2 className="text-2xl font-light bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent mb-6">
                How We Share Your Information
              </h2>
              <p className="text-base text-neutral-600 dark:text-neutral-400 leading-relaxed mb-4">
                We do not sell your personal information. We may share your information only in these circumstances:
              </p>
              <ul className="space-y-3 text-base text-neutral-600 dark:text-neutral-400">
                <li className="flex gap-3">
                  <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">•</span>
                  <span><strong>With other users:</strong> When you message a seller, they see information you choose to share</span>
                </li>
                <li className="flex gap-3">
                  <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">•</span>
                  <span><strong>Service providers:</strong> Third parties who help us operate our platform (hosting, analytics, support)</span>
                </li>
                <li className="flex gap-3">
                  <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">•</span>
                  <span><strong>Legal requirements:</strong> When required by law or to protect our rights</span>
                </li>
                <li className="flex gap-3">
                  <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">•</span>
                  <span><strong>Business transfers:</strong> In connection with a merger, acquisition, or sale of assets</span>
                </li>
              </ul>
            </div>

            {/* Your Rights */}
            <div>
              <h2 className="text-2xl font-light bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent mb-6">
                Your Privacy Rights
              </h2>
              <p className="text-base text-neutral-600 dark:text-neutral-400 leading-relaxed mb-4">
                You have the right to:
              </p>
              <ul className="space-y-3 text-base text-neutral-600 dark:text-neutral-400">
                <li className="flex gap-3">
                  <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">•</span>
                  <span>Access, update, or delete your personal information</span>
                </li>
                <li className="flex gap-3">
                  <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">•</span>
                  <span>Opt out of marketing communications</span>
                </li>
                <li className="flex gap-3">
                  <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">•</span>
                  <span>Request a copy of your data</span>
                </li>
                <li className="flex gap-3">
                  <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">•</span>
                  <span>Restrict or object to certain data processing</span>
                </li>
                <li className="flex gap-3">
                  <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">•</span>
                  <span>Delete your account entirely</span>
                </li>
              </ul>
              <p className="text-base text-neutral-500 dark:text-neutral-400 leading-relaxed mt-6">
                To exercise these rights, contact us at privacy@carly.com or through your account settings.
              </p>
            </div>

            {/* Data Security */}
            <div>
              <h2 className="text-2xl font-light bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent mb-6">
                Data Security
              </h2>
              <p className="text-base text-neutral-600 dark:text-neutral-400 leading-relaxed">
                We implement reasonable security measures to protect your information from unauthorized access, 
                alteration, disclosure, or destruction. However, no method of transmission over the internet 
                or electronic storage is 100% secure. While we strive to protect your data, we cannot guarantee absolute security.
              </p>
            </div>

            {/* Contact */}
            <div>
              <h2 className="text-2xl font-light bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent mb-6">
                Contact Us
              </h2>
              <p className="text-base text-neutral-600 dark:text-neutral-400 leading-relaxed">
                If you have questions about this Privacy Policy, contact us at:
              </p>
              <p className="text-base text-neutral-600 dark:text-neutral-400 mt-4">
                <strong>Vynance Technologies Inc.</strong><br />
                Email: privacy@carly.com
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
