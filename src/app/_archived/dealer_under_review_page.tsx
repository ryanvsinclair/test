'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

type ApplicationStatus = 'pending' | 'approved' | 'rejected';

interface Application {
  id: string;
  status: ApplicationStatus;
  created_at: string;
  dealership_name?: string;
}

export default function DealerUnderReviewPage() {
  const router = useRouter();
  const { logout } = useAuth();
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchApplication();
  }, []);

  const fetchApplication = async () => {
    try {
      const res = await fetch('/api/dealer/my-application', {
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        setApplication(data.application);
      }
    } catch (err) {
      console.error('Failed to fetch application:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/meet-carly');
  };

  const statusMap: Record<ApplicationStatus, { label: string; color: string }> = {
    pending: { label: 'Under Review', color: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400' },
    approved: { label: 'Approved', color: 'bg-green-500/10 text-green-700 dark:text-green-400' },
    rejected: { label: 'Rejected', color: 'bg-red-500/10 text-red-700 dark:text-red-400' },
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const status = application?.status || 'pending';
  const statusInfo = statusMap[status];

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <Card className="max-w-lg w-full p-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-light mb-2">Application Status</h1>
          {application?.dealership_name && (
            <p className="text-sm text-muted-foreground">{application.dealership_name}</p>
          )}
        </div>

        <div className="bg-accent/10 border border-accent/20 rounded-lg p-6 mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Status:</span>
            <Badge className={statusInfo.color}>
              {statusInfo.label}
            </Badge>
          </div>
          
          {application?.created_at && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Submitted:</span>
              <span className="text-sm text-muted-foreground">
                {new Date(application.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
          )}
        </div>

        {status === 'pending' && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              Your application is currently under review. Our team will contact you within 3-5 business days.
            </p>
          </div>
        )}

        {status === 'rejected' && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-900 dark:text-red-100">
              Unfortunately, your application was not approved. Please contact support for more information.
            </p>
          </div>
        )}

        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.push('/auth/dealer/apply')}
          >
            Update Application
          </Button>
          
          <Button
            variant="ghost"
            className="w-full"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Log Out
          </Button>
        </div>
      </Card>
    </div>
  );
}
