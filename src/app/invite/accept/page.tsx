'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';
import { validateInvitationToken, acceptInvitation } from '@/lib/api/team-invites';
import { CarlyLogo } from '@/components/branding/CarlyLogo';

export default function InviteAcceptPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (token) {
      validateToken(token);
    } else {
      setIsValidating(false);
      setError('Invalid invitation link');
    }
  }, [token]);

  const validateToken = async (tokenValue: string) => {
    try {
      const invitation = await validateInvitationToken(tokenValue);
      if (invitation) {
        setIsValid(true);
        setInviteEmail(invitation.email);
      } else {
        setError('This invitation link is invalid or has expired');
      }
    } catch (err) {
      setError('Failed to validate invitation');
    } finally {
      setIsValidating(false);
    }
  };

  const validateForm = (): boolean => {
    if (!name.trim()) {
      setError('Please enter your name');
      return false;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    setError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !token) {
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await acceptInvitation({
        token,
        name,
        password,
      });

      setIsComplete(true);

      // Redirect to dealer login after success
      setTimeout(() => {
        router.push('/auth/dealer');
      }, 2500);
    } catch (err: any) {
      setError(err.message || 'Failed to complete setup. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isValidating) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
          <p className="text-muted-foreground">Validating invitation...</p>
        </div>
      </div>
    );
  }

  if (!isValid) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-2xl font-light tracking-tight text-foreground">Invalid Invitation</h1>
          <p className="text-muted-foreground">{error || 'This invitation link is not valid.'}</p>
          <Button onClick={() => router.push('/')} className="mt-4">
            Go to Home
          </Button>
        </Card>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-2xl font-light tracking-tight bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
            Account Created!
          </h1>
          <p className="text-muted-foreground">
            Your account has been successfully created. Redirecting to login...
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Logo */}
        <div className="flex justify-center">
          <CarlyLogo />
        </div>

        {/* Card */}
        <Card className="p-8 space-y-6 border-border">
          <div className="space-y-2 text-center">
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-3xl font-light tracking-tight bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
              Complete Your Account
            </h1>
            <p className="text-muted-foreground">
              Set up your account to join the dealership team
            </p>
            <div className="pt-2">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">Email:</span> {inviteEmail}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError('');
                }}
                disabled={isSubmitting}
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                disabled={isSubmitting}
              />
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setError('');
                }}
                disabled={isSubmitting}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/10 p-3 rounded-lg">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting || !name || !password || !confirmPassword}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Complete Setup'
              )}
            </Button>
          </form>

          <p className="text-xs text-center text-muted-foreground">
            By creating an account, you agree to access this dealership's data and systems.
          </p>
        </Card>
      </div>
    </div>
  );
}
