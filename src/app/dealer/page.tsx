"use client";

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { AlertCircle, TrendingUp, MessageSquare, Calendar, Eye, Heart, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { safeDistanceToNow } from '@/lib/date-utils';
import { CheckCheck, Edit, Pause, BarChart3 } from 'lucide-react';
import { useRouter } from 'next/navigation';

type DrillDownType = 'leads' | 'conversations' | 'appointments' | 'listings' | null;

interface DashboardData {
  stats: {
    newLeadsToday: number;
    activeConversations: number;
    upcomingAppointments: number;
    activeListings: number;
  };
  todayPerformance: {
    totalViews: number;
    totalSaves: number;
    totalMessages: number;
  };
  hotListings: Array<{
    listingId: string;
    views: number;
    saves: number;
    messages: number;
    engagementScore: number;
  }>;
  needsAttention: Array<{
    id: string;
    buyerName: string;
    lastMessage: string;
    lastMessageTime?: string | Date;
    unreadCount: number;
    verified?: boolean;
    linkedListing?: {
      year: number;
      make: string;
      model: string;
    };
  }>;
}

export default function DealerDashboard() {
  const router = useRouter();
  const [drillDown, setDrillDown] = useState<DrillDownType>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      setLoading(true);
      try {
        // Dealer ID comes from session token (server-side)
        const response = await fetch('/api/dealer/dashboard', {
          credentials: 'include', // Send cookies
          cache: 'no-store',
        });
        
        // Handle auth errors
        // Note: Middleware should prevent these, but handle gracefully if they occur
        if (response.status === 401) {
          // Session expired or invalid - log out and let middleware redirect
          console.warn('[DEALER] Session invalid (401)');
          // Do not redirect on client - middleware will handle
          return;
        }
        
        if (response.status === 403) {
          // Not approved dealer - log warning but let middleware redirect
          console.warn('[DEALER] Access forbidden (403)');
          return;
        }
        
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard');
        }

        const result: DashboardData = await response.json();
        setData(result);
      } catch (error) {
        console.error('Failed to load dashboard:', error);
        // Set empty data as fallback
        setData({
          stats: {
            newLeadsToday: 0,
            activeConversations: 0,
            upcomingAppointments: 0,
            activeListings: 0,
          },
          todayPerformance: {
            totalViews: 0,
            totalSaves: 0,
            totalMessages: 0,
          },
          hotListings: [],
          needsAttention: [],
        });
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();
  }, [router]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-600 dark:text-purple-400" />
          <p className="text-neutral-500 dark:text-neutral-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8">
        <Card className="p-12 text-center">
          <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-50 mb-2">Unable to load dashboard</h3>
          <p className="text-neutral-500 dark:text-neutral-400">Please try again later.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-light tracking-tight text-neutral-900 dark:text-neutral-50">Dashboard</h1>
        <p className="text-neutral-500 dark:text-neutral-400 mt-1">Welcome back to your dealer portal</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card 
          className="p-6 border-blue-200 dark:border-blue-900/40 bg-blue-50/30 dark:bg-blue-950/20 cursor-pointer relative hover:z-10 hover:-translate-y-0.5 transition-all shadow-sm hover:shadow-md dark:hover:shadow-[0_8px_24px_rgba(0,0,0,0.45),0_0_0_1px_rgba(59,130,246,0.35),0_0_18px_rgba(59,130,246,0.25)] motion-reduce:hover:transform-none motion-reduce:hover:shadow-sm"
          onClick={() => setDrillDown('leads')}
          style={{
            transition: 'transform 180ms cubic-bezier(0.4, 0, 0.2, 1), box-shadow 180ms ease, border-color 120ms ease'
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700 dark:text-blue-400">New Leads Today</p>
              <p className="text-3xl font-light mt-1 text-blue-900 dark:text-blue-100">{data.stats.newLeadsToday}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>

        <Card 
          className="p-6 border-purple-200 dark:border-purple-900/40 bg-purple-50/30 dark:bg-purple-950/20 cursor-pointer relative hover:z-10 hover:-translate-y-0.5 transition-all shadow-sm hover:shadow-md dark:hover:shadow-[0_8px_24px_rgba(0,0,0,0.45),0_0_0_1px_rgba(168,85,247,0.35),0_0_18px_rgba(168,85,247,0.25)] motion-reduce:hover:transform-none motion-reduce:hover:shadow-sm"
          onClick={() => setDrillDown('conversations')}
          style={{
            transition: 'transform 180ms cubic-bezier(0.4, 0, 0.2, 1), box-shadow 180ms ease, border-color 120ms ease'
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-700 dark:text-purple-400">Active Conversations</p>
              <p className="text-3xl font-light mt-1 text-purple-900 dark:text-purple-100">{data.stats.activeConversations}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </Card>

        <Card 
          className="p-6 border-blue-200 dark:border-blue-900/40 bg-blue-50/30 dark:bg-blue-950/20 cursor-pointer relative hover:z-10 hover:-translate-y-0.5 transition-all shadow-sm hover:shadow-md dark:hover:shadow-[0_8px_24px_rgba(0,0,0,0.45),0_0_0_1px_rgba(59,130,246,0.35),0_0_18px_rgba(59,130,246,0.25)] motion-reduce:hover:transform-none motion-reduce:hover:shadow-sm"
          onClick={() => setDrillDown('appointments')}
          style={{
            transition: 'transform 180ms cubic-bezier(0.4, 0, 0.2, 1), box-shadow 180ms ease, border-color 120ms ease'
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700 dark:text-blue-400">Appointments</p>
              <p className="text-3xl font-light mt-1 text-blue-900 dark:text-blue-100">{data.stats.upcomingAppointments}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>

        <Card 
          className="p-6 border-purple-200 dark:border-purple-900/40 bg-purple-50/30 dark:bg-purple-950/20 cursor-pointer relative hover:z-10 hover:-translate-y-0.5 transition-all shadow-sm hover:shadow-md dark:hover:shadow-[0_8px_24px_rgba(0,0,0,0.45),0_0_0_1px_rgba(168,85,247,0.35),0_0_18px_rgba(168,85,247,0.25)] motion-reduce:hover:transform-none motion-reduce:hover:shadow-sm"
          onClick={() => setDrillDown('listings')}
          style={{
            transition: 'transform 180ms cubic-bezier(0.4, 0, 0.2, 1), box-shadow 180ms ease, border-color 120ms ease'
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-700 dark:text-purple-400">Active Listings</p>
              <p className="text-3xl font-light mt-1 text-purple-900 dark:text-purple-100">{data.stats.activeListings}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Needs Attention */}
        <Card className="border-blue-200 dark:border-blue-900/40 dark:bg-card">
          <div className="p-6 border-b border-blue-100 dark:border-blue-900/40 bg-blue-50/30 dark:bg-blue-950/20">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h2 className="text-lg font-medium text-neutral-900 dark:text-neutral-50">Needs Attention</h2>
            </div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">Conversations waiting on your response</p>
          </div>
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {data.needsAttention.map((lead) => (
              <Link
                key={lead.id}
                href="/dealer/messages"
                className="p-4 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 transition-all motion-base block rounded-lg"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-neutral-900 dark:text-neutral-50">{lead.buyerName}</p>
                      {/* Buyer verification badges intentionally hidden until feature launch */}
                      {/* {lead.verified && (
                        <span className="text-xs bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-900/50 transition-all motion-base hover:bg-blue-200 dark:hover:bg-blue-900/50">
                          Verified
                        </span>
                      )} */}
                    </div>
                    {lead.linkedListing && (
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                        {lead.linkedListing.year} {lead.linkedListing.make} {lead.linkedListing.model}
                      </p>
                    )}
                    <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-2">{lead.lastMessage}</p>
                  </div>
                  {lead.unreadCount > 0 && (
                    <span className="ml-2 w-6 h-6 rounded-full bg-blue-600 dark:bg-blue-500 text-white text-xs flex items-center justify-center transition-transform hover:scale-105">
                      {lead.unreadCount}
                    </span>
                  )}
                </div>
              </Link>
            ))}
            {data.needsAttention.length === 0 && (
              <div className="p-8 text-center text-neutral-500 dark:text-neutral-400 text-sm">
                All caught up! No messages need attention.
              </div>
            )}
          </div>
        </Card>

        {/* Hot Listings */}
        <Card className="border-purple-200 dark:border-purple-900/40 dark:bg-card">
          <div className="p-6 border-b border-purple-100 dark:border-purple-900/40 bg-purple-50/30 dark:bg-purple-950/20">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <h2 className="text-lg font-medium text-neutral-900 dark:text-neutral-50">Hot Listings</h2>
            </div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">High engagement for the price</p>
          </div>
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {data.hotListings.map((listing) => (
              <div key={listing.listingId} className="p-4">
                <div className="flex gap-4">
                  <div className="w-20 h-20 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                    <Eye className="w-8 h-8 text-neutral-400 dark:text-neutral-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-neutral-900 dark:text-neutral-50">
                      Listing {listing.listingId.slice(0, 8)}
                    </p>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                      Engagement Score: {listing.engagementScore}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {listing.views}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="w-3 h-3" />
                        {listing.saves}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        {listing.messages}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {data.hotListings.length === 0 && (
              <div className="p-8 text-center text-neutral-500 dark:text-neutral-400 text-sm">
                No listing activity yet.
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Listing Performance Snapshot */}
      <Card className="border-purple-200 dark:border-purple-900/40 bg-purple-50/20 dark:bg-purple-950/20 dark:border dark:border-neutral-800">
        <div className="p-6 border-b border-purple-100 dark:border-purple-900/40">
          <h2 className="text-lg font-medium text-neutral-900 dark:text-neutral-50">Listing Performance</h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">Activity across all active listings</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-sm mb-2">
                <Eye className="w-4 h-4" />
                Views Today
              </div>
              <p className="text-3xl font-light text-blue-900 dark:text-blue-100">{data.todayPerformance.totalViews.toLocaleString()}</p>
            </div>
            <div>
              <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 text-sm mb-2">
                <Heart className="w-4 h-4" />
                Saves Today
              </div>
              <p className="text-3xl font-light text-purple-900 dark:text-purple-100">{data.todayPerformance.totalSaves}</p>
            </div>
            <div>
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-sm mb-2">
                <MessageSquare className="w-4 h-4" />
                Messages Today
              </div>
              <p className="text-3xl font-light text-blue-900 dark:text-blue-100">{data.todayPerformance.totalMessages}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Drill-Down Popups */}
      
      {/* New Leads Today */}
      <Dialog open={drillDown === 'leads'} onOpenChange={(open) => !open && setDrillDown(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto dark:bg-neutral-900 dark:border-neutral-800">
          <DialogHeader>
            <DialogTitle className="text-xl font-light dark:text-neutral-50">New Leads Today</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {data.needsAttention.map((lead) => (
              <div key={lead.id} className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 transition-all motion-base dark:bg-neutral-950">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-neutral-900 dark:text-neutral-50">{lead.buyerName}</p>
                      {/* Buyer verification badges intentionally hidden until feature launch */}
                      {/* {lead.verified && (
                        <CheckCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      )} */}
                    </div>
                    {lead.linkedListing && (
                      <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-1">
                        {lead.linkedListing.year} {lead.linkedListing.make} {lead.linkedListing.model}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900/50">
                        Carly
                      </Badge>
                      <span className="text-xs text-neutral-500 dark:text-neutral-400">
                        {safeDistanceToNow(lead.lastMessageTime, { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <Button size="sm" variant="outline" className="hover:-translate-y-0.5 transition-all dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800" onClick={() => {
                    setDrillDown(null);
                    router.push('/dealer/messages');
                  }}>
                    View Conversation
                  </Button>
                  <Button size="sm" variant="outline" className="hover:-translate-y-0.5 transition-all dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800" onClick={() => {
                    setDrillDown(null);
                    router.push('/dealer/messages');
                  }}>
                    Message
                  </Button>
                  <Button size="sm" variant="outline" className="hover:-translate-y-0.5 transition-all dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-950/30" onClick={() => {
                    setDrillDown(null);
                    router.push('/dealer/appointments');
                  }}>
                    Schedule Appointment
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Active Conversations */}
      <Dialog open={drillDown === 'conversations'} onOpenChange={(open) => !open && setDrillDown(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto dark:bg-neutral-900 dark:border-neutral-800">
          <DialogHeader>
            <DialogTitle className="text-xl font-light dark:text-neutral-50">Active Conversations</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {data.needsAttention.map((lead) => (
              <div key={lead.id} className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-purple-50/30 dark:hover:bg-purple-950/20 transition-all motion-base dark:bg-neutral-950">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-neutral-900 dark:text-neutral-50">{lead.buyerName}</p>
                      {/* Buyer verification badges intentionally hidden until feature launch */}
                      {/* {lead.verified && (
                        <CheckCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      )} */}
                      {lead.unreadCount > 0 && (
                        <span className="w-5 h-5 rounded-full bg-purple-600 dark:bg-purple-500 text-white text-xs flex items-center justify-center">
                          {lead.unreadCount}
                        </span>
                      )}
                    </div>
                    {lead.linkedListing && (
                      <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-1">
                        {lead.linkedListing.year} {lead.linkedListing.make} {lead.linkedListing.model}
                      </p>
                    )}
                    <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-2 line-clamp-1">
                      {lead.lastMessage}
                    </p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <Badge variant="outline" className="text-xs bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-900/50">
                        Active
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="mt-3">
                  <Button size="sm" className="btn-lift bg-purple-600 hover:bg-purple-700" onClick={() => {
                    setDrillDown(null);
                    router.push('/dealer/messages');
                  }}>
                    Open Chat
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Upcoming Appointments */}
      <Dialog open={drillDown === 'appointments'} onOpenChange={(open) => !open && setDrillDown(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-light">Upcoming Appointments</DialogTitle>
          </DialogHeader>
          <div className="p-6 text-center">
            <p className="text-neutral-500 dark:text-neutral-400">
              Appointment details will be loaded from the API
            </p>
            <Button 
              className="mt-4"
              onClick={() => {
                setDrillDown(null);
                router.push('/dealer/appointments');
              }}
            >
              View All Appointments
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Active Listings */}
      <Dialog open={drillDown === 'listings'} onOpenChange={(open) => !open && setDrillDown(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-light">Active Listings</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {data.hotListings.map((listing) => (
              <div key={listing.listingId} className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-purple-50/30 dark:hover:bg-purple-950/20 transition-all motion-base">
                <div className="flex items-start gap-4">
                  <div className="w-24 h-24 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex-shrink-0 flex items-center justify-center">
                    <Eye className="w-8 h-8 text-neutral-400 dark:text-neutral-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-neutral-900 dark:text-neutral-50">
                          Listing {listing.listingId.slice(0, 12)}
                        </h3>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                          Engagement Score: {listing.engagementScore}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                        <Eye className="w-4 h-4" />
                        {listing.views}
                      </span>
                      <span className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400">
                        <Heart className="w-4 h-4" />
                        {listing.saves}
                      </span>
                      <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                        <MessageSquare className="w-4 h-4" />
                        {listing.messages}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <Button size="sm" variant="outline" className="btn-lift" onClick={() => {
                    setDrillDown(null);
                    router.push('/dealer/insights');
                  }}>
                    <BarChart3 className="w-4 h-4 mr-1.5" />
                    View Analytics
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
