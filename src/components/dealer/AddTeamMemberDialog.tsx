'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { inviteTeamMember } from '@/lib/api/team-invites';

interface AddTeamMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dealerEmail: string;
  dealerId: string;
  onSuccess?: () => void;
}

export function AddTeamMemberDialog({
  open,
  onOpenChange,
  dealerEmail,
  dealerId,
  onSuccess,
}: AddTeamMemberDialogProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'sales' | 'manager' | 'admin'>('sales');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Extract domain from dealer email
  const dealerDomain = dealerEmail.split('@')[1];

  const validateEmail = (email: string): boolean => {
    if (!email) {
      setError('Email is required');
      return false;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }

    // Domain enforcement
    const emailDomain = email.split('@')[1];
    if (emailDomain !== dealerDomain) {
      setError(`Team members must use your dealership's email domain (@${dealerDomain})`);
      return false;
    }

    setError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail(email)) {
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccessMessage('');

    try {
      await inviteTeamMember({
        email,
        role,
        dealershipId: dealerId,
      });

      setSuccessMessage(`Invitation sent to ${email}. They'll receive an email to finish setup.`);
      setEmail('');
      setRole('sales');

      // Call success callback after short delay
      setTimeout(() => {
        onSuccess?.();
        onOpenChange(false);
        setSuccessMessage('');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to send invitation. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setEmail('');
      setRole('sales');
      setError('');
      setSuccessMessage('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogTitle className="text-2xl font-light tracking-tight bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
          Add Team Member
        </DialogTitle>
        <DialogDescription className="text-muted-foreground">
          Invite a team member to access your dealership account. They must use your dealership's email domain (@{dealerDomain}).
        </DialogDescription>

        {successMessage ? (
          <div className="py-8 space-y-4">
            <div className="flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-center text-sm text-muted-foreground">
              {successMessage}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 pt-4">
            {/* Email Input */}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder={`user@${dealerDomain}`}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                onBlur={() => email && validateEmail(email)}
                disabled={isSubmitting}
                className={error ? 'border-red-500 focus-visible:ring-red-500' : ''}
              />
              {error && (
                <div className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            {/* Role Select */}
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={role} onValueChange={(value: any) => setRole(value)} disabled={isSubmitting}>
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales">Sales</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Sales can manage listings and messages. Managers can also view analytics. Admins have full access.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !email}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Invitation'
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
