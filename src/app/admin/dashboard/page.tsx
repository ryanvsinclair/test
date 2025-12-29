"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Car, MessageSquare, Building2, ClipboardList } from "lucide-react";
import type { DealerApplication } from "@/types";

interface Metrics {
  buyers: number;
  listings: number;
  messages: number;
}

interface ApplicationCounts {
  pending: number;
  approved: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [appCounts, setAppCounts] = useState<ApplicationCounts | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      // Load metrics
      const metricsRes = await fetch('/api/admin/metrics', {
        cache: 'no-store',
      });
      if (metricsRes.ok) {
        const data = await metricsRes.json();
        setMetrics(data);
      }

      // Load application counts
      const appsRes = await fetch('/api/admin/dealer-applications', {
        cache: 'no-store',
      });
      if (appsRes.ok) {
        const { applications }: { applications: DealerApplication[] } = await appsRes.json();
        const pending = applications.filter((app) => app.status === 'pending').length;
        const approved = applications.filter((app) => app.status === 'approved').length;
        setAppCounts({ pending, approved });
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Platform overview and metrics
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN - Metric Cards */}
        <div className="space-y-6">
          {/* Total Users */}
          <Card 
            className="cursor-pointer hover:bg-accent transition-colors"
            onClick={() => router.push('/admin/users')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Users
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.buyers || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Registered buyers
              </p>
            </CardContent>
          </Card>

          {/* Active Listings */}
          <Card 
            className="cursor-pointer hover:bg-accent transition-colors"
            onClick={() => router.push('/admin/listings')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Listings
              </CardTitle>
              <Car className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.listings || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Total vehicles listed
              </p>
            </CardContent>
          </Card>

          {/* Messages */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Messages
              </CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.messages || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Platform messages
              </p>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN - Primary Cards */}
        <div className="lg:col-span-2 space-y-6">
          {/* Dealer Applications */}
          <Card 
            className="cursor-pointer hover:bg-accent transition-colors"
            onClick={() => router.push('/admin/applications')}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Dealer Applications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <div className="text-3xl font-bold text-orange-600">
                    {appCounts?.pending || 0}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Pending Review
                  </p>
                </div>
                <div>
                  <div className="text-3xl font-bold text-green-600">
                    {appCounts?.approved || 0}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Approved
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dealer Metrics */}
          <Card 
            className="cursor-pointer hover:bg-accent transition-colors"
            onClick={() => router.push('/admin/dealers')}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Dealer Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                View dealer performance, team members, listings, and engagement metrics
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

