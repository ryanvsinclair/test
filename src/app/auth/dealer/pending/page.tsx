'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Mail, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function DealerPendingPage() {
  const { user, isDealerApproved, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If user is approved, redirect to dealer page
    if (isDealerApproved) {
      router.push('/dealer');
    }
  }, [user, isDealerApproved, router]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="max-w-2xl w-full p-12">
        <div className="text-center space-y-6">
          {/* Icon */}
          <div className="w-20 h-20 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto">
            <Clock className="w-10 h-10 text-yellow-500" />
          </div>

          {/* Title */}
          <div className="space-y-2">
            <h1 className="text-4xl font-light tracking-tight">
              Application Under Review
            </h1>
            <p className="text-muted-foreground text-lg">
              Your dealership application is being reviewed by our team
            </p>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
            <div className="bg-muted/50 p-6 rounded-xl text-left">
              <Mail className="w-6 h-6 mb-3 text-accent" />
              <h3 className="font-semibold mb-2">Check Your Email</h3>
              <p className="text-sm text-muted-foreground">
                We'll notify you at <strong>{user?.email}</strong> once your application is reviewed
              </p>
            </div>

            <div className="bg-muted/50 p-6 rounded-xl text-left">
              <CheckCircle className="w-6 h-6 mb-3 text-accent" />
              <h3 className="font-semibold mb-2">What Happens Next</h3>
              <p className="text-sm text-muted-foreground">
                Our team typically reviews applications within 3-5 business days
              </p>
            </div>
          </div>

          {/* Message */}
          <div className="bg-accent/5 border border-accent/20 rounded-lg p-6 mt-8">
            <p className="text-sm text-foreground">
              <strong>Note:</strong> You will not have access to the dealer portal until your application is approved. 
              We'll send you an email with login instructions once you're approved.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 mt-8">
            <Link href="/">
              <Button variant="outline" className="w-full rounded-lg">
                Return to Home
              </Button>
            </Link>
            <Button 
              variant="ghost" 
              onClick={logout}
              className="w-full rounded-lg"
            >
              Sign Out
            </Button>
          </div>

          {/* Help */}
          <p className="text-xs text-muted-foreground mt-6">
            Questions about your application?{' '}
            <a href="mailto:support@example.com" className="text-accent hover:underline">
              Contact our support team
            </a>
          </p>
        </div>
      </Card>
    </div>
  );
}
