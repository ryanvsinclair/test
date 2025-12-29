'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { dealerApplicationService } from '@/lib/api/dealer-applications';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

const DEALERSHIP_TYPES = [
  { value: 'USED', label: 'Used Car Dealership' },
  { value: 'NEW', label: 'New Car Dealership' },
] as const;

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const CONTACT_METHODS = [
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'either', label: 'Either' },
] as const;

export default function DealerApplicationPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3 | 'success'>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form data
  const [dealershipName, setDealershipName] = useState('');
  const [dealershipType, setDealershipType] = useState<'USED' | 'NEW'>('USED');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [region, setRegion] = useState('');
  const [country, setCountry] = useState('');
  const [timezone, setTimezone] = useState('');

  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [preferredContact, setPreferredContact] = useState<'email' | 'phone' | 'either'>('email');

  const [daysOfOperation, setDaysOfOperation] = useState<string[]>(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
  const [openingTime, setOpeningTime] = useState('09:00');
  const [closingTime, setClosingTime] = useState('18:00');
  const [specialNotes, setSpecialNotes] = useState('');

  const [websiteUrl, setWebsiteUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');
  const [tiktokUrl, setTiktokUrl] = useState('');
  const [googleBusinessUrl, setGoogleBusinessUrl] = useState('');
  const [otherPlatforms, setOtherPlatforms] = useState('');

  const [description, setDescription] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');

  const toggleDay = (day: string) => {
    setDaysOfOperation(prev =>
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };
  
  // ONLY redirect after loading completes - tri-state logic
  useEffect(() => {
    if (isLoading) return; // Never redirect during loading
    
    if (!user) {
      router.push('/auth');
      return;
    }
    
    // Pre-fill email from auth
    if (user.email && !contactEmail) {
      setContactEmail(user.email);
    }
  }, [user, isLoading, contactEmail, router]);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
  setError('');
  setLoading(true);

  try {
    await dealerApplicationService.createApplication({
      dealershipName,
      dealershipType,
      address,
      city,
      region,
      country,
      timezone,
      contactName,
      contactEmail,
      contactPhone,
      preferredContact,
      daysOfOperation,
      openingTime,
      closingTime,
      specialNotes: specialNotes || undefined,
      websiteUrl: websiteUrl || undefined,
      instagramUrl: instagramUrl || undefined,
      facebookUrl: facebookUrl || undefined,
      tiktokUrl: tiktokUrl || undefined,
      googleBusinessUrl: googleBusinessUrl || undefined,
      otherPlatforms: otherPlatforms || undefined,
      description: description || undefined,
      additionalInfo: additionalInfo || undefined,
    });

    setStep('success');
  } catch (err: any) {
    // Handle 401 - redirect to login
    if (err.message?.includes('logged in') || err.status === 401) {
      setError('Your session expired. Please sign in again.');
      setTimeout(() => {
        router.push('/auth');
      }, 2000);
      return;
    }
    
    // Handle 409 - already submitted
    if (err.message?.includes('already submitted') || err.status === 409) {
      setError('You have already submitted an application. Check your dealer portal for status.');
      return;
    }
    
    setError(err.message || 'Failed to submit application. Please try again.');
  } finally {
    setLoading(false);
  }
};

const canProceed = () => {
  if (step === 1) {
    return Boolean(dealershipName && address && city && region && country && timezone);
  }
  if (step === 2) {
    return Boolean(
      contactName &&
      contactEmail &&
      contactPhone &&
      daysOfOperation.length > 0 &&
      openingTime &&
      closingTime
    );
  }
  return true;
};

  if (step === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-md w-full p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h1 className="text-3xl font-light mb-4">Application Received</h1>
          <p className="text-muted-foreground mb-4">
            Your dealership application has been submitted successfully.
          </p>
          <div className="bg-accent/10 border border-accent/20 rounded-lg p-4 mb-8">
            <p className="text-sm">
              Our team will review your application within 3-5 business days. 
              You can log in any time to check your application status.
            </p>
          </div>
          <div className="space-y-3">
            <Link href="/dealer">
              <Button className="w-full rounded-lg">
                Go to Dealer Portal
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <Link href="/auth/intent">
          <button className="mb-8 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </button>
        </Link>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-light tracking-tight mb-2">Dealership Application</h1>
          <p className="text-muted-foreground">Step {step} of 3</p>
        </div>

        {/* Progress Bar */}
        <div className="flex gap-2 mb-8">
          <div className={`flex-1 h-1 rounded-full ${step >= 1 ? 'bg-accent' : 'bg-muted'}`} />
          <div className={`flex-1 h-1 rounded-full ${step >= 2 ? 'bg-accent' : 'bg-muted'}`} />
          <div className={`flex-1 h-1 rounded-full ${step >= 3 ? 'bg-accent' : 'bg-muted'}`} />
        </div>

        <Card className="p-8">
          {/* Step 1: Dealership Information */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-light mb-2">Dealership Information</h2>
                <p className="text-sm text-muted-foreground">Tell us about your dealership</p>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="dealershipName">Dealership Name *</Label>
                  <Input
                    id="dealershipName"
                    value={dealershipName}
                    onChange={(e) => setDealershipName(e.target.value)}
                    placeholder="Elite Auto Sales"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dealershipType">Dealership Type *</Label>
                  <select
                    id="dealershipType"
                    value={dealershipType}
                    onChange={(e) => setDealershipType(e.target.value as 'USED' | 'NEW')}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent"
                    required
                  >
                    {DEALERSHIP_TYPES.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground">
                    Select the primary type of vehicles you sell.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Physical Address *</Label>
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="123 Main Street"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Los Angeles"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="region">State/Region *</Label>
                    <Input
                      id="region"
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      placeholder="CA"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="country">Country *</Label>
                    <Input
                      id="country"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="United States"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone *</Label>
                    <Input
                      id="timezone"
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      placeholder="PST"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Contact & Operating Hours */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-light mb-2">Contact & Operating Hours</h2>
                <p className="text-sm text-muted-foreground">How can we reach you?</p>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="contactName">Primary Contact Name *</Label>
                  <Input
                    id="contactName"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="John Smith"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Contact Email *</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="john@eliteauto.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Contact Phone *</Label>
                  <Input
                    id="contactPhone"
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="preferredContact">Preferred Contact Method *</Label>
                  <select
                    id="preferredContact"
                    value={preferredContact}
                    onChange={(e) => setPreferredContact(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent"
                    required
                  >
                    {CONTACT_METHODS.map(method => (
                      <option key={method.value} value={method.value}>
                        {method.label}
                      </option>
                    ))}
                  </select>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Days of Operation *</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {DAYS_OF_WEEK.map(day => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={`px-3 py-2 rounded-lg border transition-colors ${
                          daysOfOperation.includes(day)
                            ? 'border-accent bg-accent/10 text-accent'
                            : 'border-border bg-background hover:bg-muted'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="openingTime">Opening Time *</Label>
                    <input
                      id="openingTime"
                      type="time"
                      value={openingTime}
                      onChange={(e) => setOpeningTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="closingTime">Closing Time *</Label>
                    <input
                      id="closingTime"
                      type="time"
                      value={closingTime}
                      onChange={(e) => setClosingTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="specialNotes">Special Notes (Optional)</Label>
                  <Textarea
                    id="specialNotes"
                    value={specialNotes}
                    onChange={(e) => setSpecialNotes(e.target.value)}
                    placeholder="Appointments only, closed on holidays, etc."
                    className="min-h-[80px] resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Online Presence & Additional Info */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-light mb-2">Online Presence & Details</h2>
                <p className="text-sm text-muted-foreground">Help us learn more about your dealership</p>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="websiteUrl">Website URL</Label>
                  <Input
                    id="websiteUrl"
                    type="url"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="https://eliteauto.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instagramUrl">Instagram</Label>
                  <Input
                    id="instagramUrl"
                    type="url"
                    value={instagramUrl}
                    onChange={(e) => setInstagramUrl(e.target.value)}
                    placeholder="https://instagram.com/eliteauto"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="facebookUrl">Facebook</Label>
                  <Input
                    id="facebookUrl"
                    type="url"
                    value={facebookUrl}
                    onChange={(e) => setFacebookUrl(e.target.value)}
                    placeholder="https://facebook.com/eliteauto"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tiktokUrl">TikTok</Label>
                  <Input
                    id="tiktokUrl"
                    type="url"
                    value={tiktokUrl}
                    onChange={(e) => setTiktokUrl(e.target.value)}
                    placeholder="https://tiktok.com/@eliteauto"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="googleBusinessUrl">Google Business Profile</Label>
                  <Input
                    id="googleBusinessUrl"
                    type="url"
                    value={googleBusinessUrl}
                    onChange={(e) => setGoogleBusinessUrl(e.target.value)}
                    placeholder="https://g.page/eliteauto"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="otherPlatforms">Other Platforms</Label>
                  <Textarea
                    id="otherPlatforms"
                    value={otherPlatforms}
                    onChange={(e) => setOtherPlatforms(e.target.value)}
                    placeholder="List any other relevant platforms..."
                    className="min-h-[80px] resize-none"
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="description">Dealership Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Tell us about your dealership, specializations, years in business, etc."
                    className="min-h-[100px] resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="additionalInfo">Additional Information</Label>
                  <Textarea
                    id="additionalInfo"
                    value={additionalInfo}
                    onChange={(e) => setAdditionalInfo(e.target.value)}
                    placeholder="Anything else you'd like us to know before approval..."
                    className="min-h-[100px] resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950 p-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-8">
            {step > 1 && step !== 'success' && (
              <Button
                variant="outline"
                onClick={() => setStep((step - 1) as any)}
                className="flex-1 rounded-lg"
              >
                Back
              </Button>
            )}
            {step < 3 ? (
              <Button
                onClick={() => setStep((step + 1) as any)}
                disabled={!canProceed()}
                className="flex-1 rounded-lg"
              >
                Continue
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={loading || !canProceed()}
                className="flex-1 rounded-lg"
              >
                {loading ? 'Submitting...' : 'Submit Application'}
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
