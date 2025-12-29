"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';

export default function ContactCarlyPage() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.email || '',
    email: user?.email || '',
    category: '',
    message: ''
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
          <h1 className="text-6xl font-light tracking-tight bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent mb-8 dark:drop-shadow-[0_0_12px_rgba(139,92,246,0.35)]">
            Contact Carly
          </h1>

          <p className="text-2xl text-neutral-600 dark:text-neutral-400 font-light leading-relaxed mb-16">
            We're here to help. Send us a message and we'll respond as soon as possible.
          </p>

          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-8">
              <div>
                <label className="block text-sm font-medium bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent mb-2">
                  Name
                </label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="h-12"
                />
              </div>

              <div>
                <label className="block text-sm font-medium bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent mb-2">
                  Email
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="h-12"
                />
              </div>

              <div>
                <label className="block text-sm font-medium bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent mb-2">
                  What can we help with?
                </label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="account">Account & Settings</SelectItem>
                    <SelectItem value="buying">Buying Process</SelectItem>
                    <SelectItem value="technical">Technical Issue</SelectItem>
                    <SelectItem value="trust">Trust & Safety</SelectItem>
                    <SelectItem value="feedback">Feedback</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent mb-2">
                  Message
                </label>
                <Textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  required
                  rows={8}
                  className="resize-none"
                  placeholder="Describe your question or issue..."
                />
              </div>

              <Button type="submit" size="lg" className="w-full h-14 text-base">
                Send Message
              </Button>

              <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center">
                We typically respond within 24 hours
              </p>
            </form>
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-3xl font-light bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent mb-4">
                Message Sent
              </h2>
              <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-8">
                We've received your message and will respond soon.
              </p>
              <Button
                onClick={() => setSubmitted(false)}
                variant="outline"
                size="lg"
                className="h-12 px-8"
              >
                Send Another Message
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
