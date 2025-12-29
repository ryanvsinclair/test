"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowLeft,
  Car,
  Eye,
  Heart,
  Calendar,
  Users,
} from 'lucide-react';

interface DealerProfile {
  id: string;
  email: string;
  dealership_name?: string;
  reputation_score?: number;
  created_at: string;
  [key: string]: any;
}

interface TeamMember {
  id: string;
  email: string;
  role: string;
  [key: string]: any;
}

interface Listing {
  id: string;
  year: number;
  make: string;
  model: string;
  price: number;
  views?: number;
  likes?: number;
  appointments?: number;
  [key: string]: any;
}

export default function DealerDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const dealerId = params.id;

  const [dealer, setDealer] = useState<DealerProfile | null>(null);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDealerData();
  }, [dealerId]);

  async function loadDealerData() {
    try {
      // Load dealer profile
      const dealerRes = await fetch(`/api/admin/dealers/${dealerId}`, {
        cache: 'no-store',
      });
      if (dealerRes.ok) {
        const { dealer: dealerData } = await dealerRes.json();
        setDealer(dealerData);
      }

      // Load team members
      const teamRes = await fetch(`/api/admin/dealers/${dealerId}/team`, {
        cache: 'no-store',
      });
      if (teamRes.ok) {
        const { team: teamData } = await teamRes.json();
        setTeam(teamData);
      }

      // Load listings
      const listingsRes = await fetch(`/api/admin/dealers/${dealerId}/listings`, {
        cache: 'no-store',
      });
      if (listingsRes.ok) {
        const { listings: listingsData } = await listingsRes.json();
        setListings(listingsData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dealer data');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-muted-foreground">Loading dealer details...</div>
      </div>
    );
  }

  if (error || !dealer) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="text-destructive">{error || 'Dealer not found'}</div>
      </div>
    );
  }

  const totalViews = listings.reduce((sum, l) => sum + (l.views || 0), 0);
  const totalLikes = listings.reduce((sum, l) => sum + (l.likes || 0), 0);
  const totalAppointments = listings.reduce((sum, l) => sum + (l.appointments || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-4xl font-bold">{dealer.dealership_name || 'Unnamed Dealer'}</h1>
          <p className="text-muted-foreground mt-1">{dealer.email}</p>
          {dealer.reputation_score && (
            <Badge variant="secondary" className="mt-2">
              Reputation: {dealer.reputation_score.toFixed(1)}
            </Badge>
          )}
        </div>
      </div>

      {/* Aggregate Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalViews}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Likes</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLikes}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAppointments}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{team.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Team Members */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          {team.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No team members</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {team.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{member.role}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Listings */}
      <Card>
        <CardHeader>
          <CardTitle>Listings ({listings.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {listings.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No listings</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead className="text-right">Views</TableHead>
                  <TableHead className="text-right">Likes</TableHead>
                  <TableHead className="text-right">Appointments</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listings.map((listing) => (
                  <TableRow key={listing.id}>
                    <TableCell className="font-medium">
                      {listing.year} {listing.make} {listing.model}
                    </TableCell>
                    <TableCell>
                      ${listing.price?.toLocaleString() || 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">{listing.views || 0}</TableCell>
                    <TableCell className="text-right">{listing.likes || 0}</TableCell>
                    <TableCell className="text-right">{listing.appointments || 0}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Listings</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.active_listings}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.total_listings} total · {metrics.sold_listings} sold
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversations</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.total_conversations}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.messages_sent} sent · {metrics.messages_received} received
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.total_appointments}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.scheduled_appointments} scheduled · {metrics.completed_appointments} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Activity</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{formatDate(metrics.last_activity_at)}</div>
            <p className="text-xs text-muted-foreground">
              Most recent interaction
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Activity (7 days)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">New Listings</span>
              <span className="font-bold">{metrics.recent_listings_7d}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Messages Sent</span>
              <span className="font-bold">{metrics.recent_messages_7d}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Appointments Booked</span>
              <span className="font-bold">{metrics.recent_appointments_7d}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Engagement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Response Rate</span>
              <span className="font-bold">{engagementRate}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Active Conversations</span>
              <span className="font-bold">{metrics.active_conversations}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Messages</span>
              <span className="font-bold">{metrics.total_messages}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Appointment Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Completion Rate</span>
              <span className="font-bold">{appointmentCompletionRate}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Cancelled</span>
              <span className="font-bold text-red-600">{metrics.cancelled_appointments}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Scheduled</span>
              <span className="font-bold text-blue-600">{metrics.scheduled_appointments}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Listings */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Listings</CardTitle>
          <CardDescription>Last 10 listings from this dealer</CardDescription>
        </CardHeader>
        <CardContent>
          {listings.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No listings yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>VIN</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listings.map((listing) => (
                  <TableRow key={listing.id}>
                    <TableCell>
                      {listing.year} {listing.make} {listing.model}
                    </TableCell>
                    <TableCell className="font-mono text-sm">{listing.vin || 'N/A'}</TableCell>
                    <TableCell>
                      {listing.status === 'active' && <Badge className="bg-green-600">Active</Badge>}
                      {listing.status === 'sold' && <Badge variant="secondary">Sold</Badge>}
                      {listing.status === 'deleted' && <Badge variant="destructive">Deleted</Badge>}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(listing.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Recent Conversations */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Conversations</CardTitle>
          <CardDescription>Last 10 conversations with buyers</CardDescription>
        </CardHeader>
        <CardContent>
          {conversations.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No conversations yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Buyer ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Unread</TableHead>
                  <TableHead>Last Message</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {conversations.map((convo) => (
                  <TableRow key={convo.id}>
                    <TableCell className="font-mono text-sm">{convo.buyer_id.slice(0, 8)}...</TableCell>
                    <TableCell>
                      {convo.status === 'active' ? (
                        <Badge variant="outline">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Closed</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {convo.unread_count > 0 ? (
                        <Badge variant="destructive">{convo.unread_count}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDateTime(convo.last_message_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Recent Appointments */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Appointments</CardTitle>
          <CardDescription>Last 10 scheduled test drives</CardDescription>
        </CardHeader>
        <CardContent>
          {appointments.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No appointments yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Buyer ID</TableHead>
                  <TableHead>Scheduled</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointments.map((apt) => (
                  <TableRow key={apt.id}>
                    <TableCell className="font-mono text-sm">{apt.buyer_id.slice(0, 8)}...</TableCell>
                    <TableCell className="text-sm">{formatDateTime(apt.scheduled_at)}</TableCell>
                    <TableCell>
                      {apt.status === 'scheduled' && (
                        <Badge variant="outline" className="text-blue-600 border-blue-600">
                          <Clock className="h-3 w-3 mr-1" />
                          Scheduled
                        </Badge>
                      )}
                      {apt.status === 'completed' && (
                        <Badge className="bg-green-600">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Completed
                        </Badge>
                      )}
                      {apt.status === 'cancelled' && (
                        <Badge variant="destructive">
                          <XCircle className="h-3 w-3 mr-1" />
                          Cancelled
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(apt.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
