'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function DealerOnboardingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dealership, setDealership] = useState<any>(null);

  const [formData, setFormData] = useState({
    branding: {
      logoUrl: '',
      primaryColor: '',
      secondaryColor: '',
    },
    payoutDetails: {
      accountName: '',
      bankName: '',
      accountNumber: '',
      routingNumber: '',
    },
    businessHours: {
      daysOfOperation: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      openingTime: '09:00',
      closingTime: '18:00',
    },
  });

  useEffect(() => {
    if (user?.dealershipId) {
      fetch(`/api/dealerships/${user.dealershipId}`)
        .then(res => res.json())
        .then(data => {
          setDealership(data.dealership);
          setLoading(false);
        })
        .catch(() => {
          setError('Failed to load dealership');
          setLoading(false);
        });
    }
  }, [user]);

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const response = await fetch(`/api/dealerships/${user?.dealershipId}/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to complete onboarding');
      }

      // Onboarding complete - redirect to dealer portal
      router.push('/dealer');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete onboarding');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Complete Your Dealership Setup</CardTitle>
            <CardDescription>
              Your application has been approved! Complete these final steps to activate your account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleComplete} className="space-y-8">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              {/* Branding Section */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">Branding</h3>
                <div>
                  <Label htmlFor="logoUrl">Logo URL</Label>
                  <Input
                    id="logoUrl"
                    type="url"
                    value={formData.branding.logoUrl}
                    onChange={(e) => setFormData({
                      ...formData,
                      branding: { ...formData.branding, logoUrl: e.target.value }
                    })}
                    placeholder="https://example.com/logo.png"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="primaryColor">Primary Color</Label>
                    <Input
                      id="primaryColor"
                      type="color"
                      value={formData.branding.primaryColor}
                      onChange={(e) => setFormData({
                        ...formData,
                        branding: { ...formData.branding, primaryColor: e.target.value }
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="secondaryColor">Secondary Color</Label>
                    <Input
                      id="secondaryColor"
                      type="color"
                      value={formData.branding.secondaryColor}
                      onChange={(e) => setFormData({
                        ...formData,
                        branding: { ...formData.branding, secondaryColor: e.target.value }
                      })}
                    />
                  </div>
                </div>
              </div>

              {/* Payout Details Section */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">Payout Information</h3>
                <div>
                  <Label htmlFor="accountName">Account Name *</Label>
                  <Input
                    id="accountName"
                    required
                    value={formData.payoutDetails.accountName}
                    onChange={(e) => setFormData({
                      ...formData,
                      payoutDetails: { ...formData.payoutDetails, accountName: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="bankName">Bank Name *</Label>
                  <Input
                    id="bankName"
                    required
                    value={formData.payoutDetails.bankName}
                    onChange={(e) => setFormData({
                      ...formData,
                      payoutDetails: { ...formData.payoutDetails, bankName: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="accountNumber">Account Number *</Label>
                  <Input
                    id="accountNumber"
                    required
                    type="password"
                    value={formData.payoutDetails.accountNumber}
                    onChange={(e) => setFormData({
                      ...formData,
                      payoutDetails: { ...formData.payoutDetails, accountNumber: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="routingNumber">Routing Number *</Label>
                  <Input
                    id="routingNumber"
                    required
                    value={formData.payoutDetails.routingNumber}
                    onChange={(e) => setFormData({
                      ...formData,
                      payoutDetails: { ...formData.payoutDetails, routingNumber: e.target.value }
                    })}
                  />
                </div>
              </div>

              {/* Business Hours Section */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">Business Hours</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="openingTime">Opening Time</Label>
                    <Input
                      id="openingTime"
                      type="time"
                      value={formData.businessHours.openingTime}
                      onChange={(e) => setFormData({
                        ...formData,
                        businessHours: { ...formData.businessHours, openingTime: e.target.value }
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="closingTime">Closing Time</Label>
                    <Input
                      id="closingTime"
                      type="time"
                      value={formData.businessHours.closingTime}
                      onChange={(e) => setFormData({
                        ...formData,
                        businessHours: { ...formData.businessHours, closingTime: e.target.value }
                      })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="flex-1"
                >
                  {submitting ? 'Activating...' : 'Complete Onboarding & Go Live'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
