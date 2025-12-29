"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { AlertTriangle } from 'lucide-react';

export default function ReportIssuePage() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    reporterEmail: user?.email || '',
    issueType: '',
    listingUrl: '',
    sellerName: '',
    description: '',
    urgent: false
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement form submission
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen">
      <section className="relative px-8 pt-32 pb-24">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <AlertTriangle className="w-8 h-8 text-neutral-900 dark:text-neutral-50" />
            <h1 className="text-6xl font-light tracking-tight bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent dark:drop-shadow-[0_0_12px_rgba(139,92,246,0.35)]">
              Report an Issue
            </h1>
          </div>

          <p className="text-2xl text-neutral-600 dark:text-neutral-400 font-light leading-relaxed mb-16">
            Help us maintain trust and safety on Carly. Report suspicious listings, inappropriate behavior, or technical problems.
          </p>

          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-8">
              <div>
                <label className="block text-sm font-medium text-neutral-900 dark:text-neutral-50 mb-2">
                  Your Email
                </label>
                <Input
                  type="email"
                  value={formData.reporterEmail}
                  onChange={(e) => setFormData({ ...formData, reporterEmail: e.target.value })}
                  required
                  className="h-12"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-900 dark:text-neutral-50 mb-2">
                  Issue Type
                </label>
                <Select
                  value={formData.issueType}
                  onValueChange={(value) => setFormData({ ...formData, issueType: value })}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select issue type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fraud">Suspected Fraud</SelectItem>
                    <SelectItem value="fake-listing">Fake or Duplicate Listing</SelectItem>
                    <SelectItem value="misleading">Misleading Information</SelectItem>
                    <SelectItem value="harassment">Harassment or Inappropriate Behavior</SelectItem>
                    <SelectItem value="spam">Spam Messages</SelectItem>
                    <SelectItem value="technical">Technical Problem</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-900 dark:text-neutral-50 mb-2">
                  Listing URL (if applicable)
                </label>
                <Input
                  type="url"
                  value={formData.listingUrl}
                  onChange={(e) => setFormData({ ...formData, listingUrl: e.target.value })}
                  className="h-12"
                  placeholder="https://carly.com/listings/..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-900 dark:text-neutral-50 mb-2">
                  Seller or User Name (if applicable)
                </label>
                <Input
                  type="text"
                  value={formData.sellerName}
                  onChange={(e) => setFormData({ ...formData, sellerName: e.target.value })}
                  className="h-12"
                  placeholder="Username or dealer name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-900 dark:text-neutral-50 mb-2">
                  Description
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  rows={8}
                  className="resize-none"
                  placeholder="Please provide as much detail as possible..."
                />
              </div>

              <div className="flex items-start gap-3 p-4 bg-neutral-50 dark:bg-neutral-900/50 rounded-lg">
                <input
                  type="checkbox"
                  id="urgent"
                  checked={formData.urgent}
                  onChange={(e) => setFormData({ ...formData, urgent: e.target.checked })}
                  className="mt-1"
                />
                <label htmlFor="urgent" className="text-sm text-neutral-600 dark:text-neutral-400">
                  This is urgent (involves immediate safety risk or ongoing fraud)
                </label>
              </div>

              <Button type="submit" size="lg" className="w-full h-14 text-base">
                Submit Report
              </Button>

              <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center">
                All reports are reviewed. Urgent issues are prioritized.
              </p>
            </form>
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-3xl font-light text-neutral-900 dark:text-neutral-50 mb-4">
                Report Submitted
              </h2>
              <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-8">
                Thank you for helping keep Carly safe. We'll review this report and take appropriate action.
              </p>
              <Button
                onClick={() => setSubmitted(false)}
                variant="outline"
                size="lg"
                className="h-12 px-8"
              >
                Submit Another Report
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
