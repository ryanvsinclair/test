export default function AccessibilityPage() {
  return (
    <div className="min-h-screen">
      <section className="relative px-8 pt-32 pb-24">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-6xl font-light tracking-tight bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent mb-8 dark:drop-shadow-[0_0_12px_rgba(139,92,246,0.35)]">
            Accessibility
          </h1>

          <p className="text-2xl text-neutral-600 dark:text-neutral-400 font-light leading-relaxed mb-16">
            Carly is committed to ensuring digital accessibility for all users, including those with disabilities.
          </p>

          <div className="space-y-16">
            {/* Our Commitment */}
            <div>
              <h2 className="text-sm uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-6">
                Our Commitment
              </h2>
              <p className="text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed mb-4">
                We strive to meet WCAG 2.1 Level AA standards and continuously improve the accessibility of our platform.
              </p>
              <p className="text-base text-neutral-500 dark:text-neutral-400 leading-relaxed">
                Accessibility is not a checklist — it's an ongoing process. We're actively working to identify and 
                fix barriers, improve keyboard navigation, enhance screen reader compatibility, and ensure all users 
                can confidently browse and buy vehicles through Carly.
              </p>
            </div>

            {/* Accessibility Features */}
            <div>
              <h2 className="text-sm uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-6">
                Current Accessibility Features
              </h2>
              <ul className="space-y-4 text-base text-neutral-600 dark:text-neutral-400">
                <li className="flex gap-3">
                  <span className="text-neutral-900 dark:text-neutral-50">•</span>
                  <span>Keyboard navigation support across all core features</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-neutral-900 dark:text-neutral-50">•</span>
                  <span>Screen reader compatibility with semantic HTML and ARIA labels</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-neutral-900 dark:text-neutral-50">•</span>
                  <span>High contrast mode and dark theme options</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-neutral-900 dark:text-neutral-50">•</span>
                  <span>Scalable text without loss of functionality</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-neutral-900 dark:text-neutral-50">•</span>
                  <span>Alternative text for all meaningful images</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-neutral-900 dark:text-neutral-50">•</span>
                  <span>Clear focus indicators for interactive elements</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-neutral-900 dark:text-neutral-50">•</span>
                  <span>Consistent navigation and layout structure</span>
                </li>
              </ul>
            </div>

            {/* Known Issues */}
            <div>
              <h2 className="text-sm uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-6">
                Known Limitations
              </h2>
              <p className="text-base text-neutral-600 dark:text-neutral-400 leading-relaxed mb-4">
                We're aware of the following areas that need improvement:
              </p>
              <ul className="space-y-4 text-base text-neutral-600 dark:text-neutral-400">
                <li className="flex gap-3">
                  <span className="text-neutral-900 dark:text-neutral-50">•</span>
                  <span>Some third-party embedded content may not be fully accessible</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-neutral-900 dark:text-neutral-50">•</span>
                  <span>Vehicle image galleries could be improved for screen reader users</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-neutral-900 dark:text-neutral-50">•</span>
                  <span>Real-time messaging notifications need better accessibility support</span>
                </li>
              </ul>
              <p className="text-base text-neutral-500 dark:text-neutral-400 leading-relaxed mt-6">
                These issues are being actively addressed in our roadmap.
              </p>
            </div>

            {/* Feedback */}
            <div>
              <h2 className="text-sm uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-6">
                Report Accessibility Issues
              </h2>
              <p className="text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed mb-4">
                If you encounter an accessibility barrier while using Carly, please let us know.
              </p>
              <p className="text-base text-neutral-500 dark:text-neutral-400 leading-relaxed mb-6">
                Contact us at <a href="mailto:accessibility@carly.com" className="text-neutral-900 dark:text-neutral-50 underline hover:text-neutral-600 dark:hover:text-neutral-400 transition-colors">accessibility@carly.com</a> with:
              </p>
              <ul className="space-y-3 text-base text-neutral-600 dark:text-neutral-400 mb-6">
                <li className="flex gap-3">
                  <span className="text-neutral-900 dark:text-neutral-50">•</span>
                  <span>Page URL where the issue occurred</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-neutral-900 dark:text-neutral-50">•</span>
                  <span>Description of the problem</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-neutral-900 dark:text-neutral-50">•</span>
                  <span>Assistive technology you're using (if applicable)</span>
                </li>
              </ul>
              <p className="text-base text-neutral-500 dark:text-neutral-400 leading-relaxed">
                We review all accessibility feedback and prioritize fixes based on impact and severity.
              </p>
            </div>

            {/* Third-Party Content */}
            <div>
              <h2 className="text-sm uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-6">
                Third-Party Content
              </h2>
              <p className="text-base text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Some content on Carly comes from third parties (such as vehicle photos from sellers). 
                While we encourage accessible practices, we cannot guarantee the accessibility of all user-generated content. 
                If you encounter issues with specific listings, please report them so we can work with sellers to improve.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
