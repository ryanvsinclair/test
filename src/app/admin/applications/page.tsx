"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CheckCircle,
  Clock,
  XCircle,
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import type { DealerApplication, DealerApplicationStatus } from "@/types";

function formatDate(dateString: string) {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return '—';
  }
}

const STATUS_LABEL_MAP: Record<string, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  active: 'Active',
};

export default function DealerApplicationsPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [applications, setApplications] = useState<DealerApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedApp, setSelectedApp] = useState<DealerApplication | null>(null);
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    loadApplications();
  }, []);

  async function loadApplications() {
    try {
      setError(null);
      
      console.log('[ADMIN] Fetching dealership applications from API...');
      
      const res = await fetch("/api/admin/dealerships?status=pending", {
        cache: "no-store",
      });

      console.log('[ADMIN] Response status:', res.status);

      if (!res.ok) {
        const json = await res.json();
        console.error('[ADMIN] Error response:', json);
        throw new Error(json.error || "Failed to fetch applications");
      }

      const json = await res.json();
      console.log('[ADMIN] Response data:', json);
      console.log('[ADMIN] Applications count:', json.dealerships?.length ?? 0);
      
      setApplications(json.dealerships || []);
    } catch (err) {
      console.error('[ADMIN] Caught error:', err);
      setError(err instanceof Error ? err.message : "Failed to load applications");
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(applicationId: string) {
    if (!user) return;
    
    if (approving) {
      console.log('[ADMIN] Approval already in progress, ignoring duplicate click');
      return;
    }

    setApproving(true);
    
    try {
      const response = await fetch(`/api/admin/dealerships/${applicationId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        await loadApplications();
        setSelectedApp(null);
      } else if (response.status === 400 && data.error?.includes('already processed')) {
        console.log('[ADMIN] Application already processed, refreshing list...');
        await loadApplications();
        setSelectedApp(null);
      } else {
        alert(data.error || "Failed to approve application");
      }
    } catch (err) {
      console.error('[ADMIN] Approval request failed:', err);
      alert("Network error. Please try again.");
    } finally {
      setApproving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-muted-foreground">Loading applications...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={() => loadApplications()} className="mt-4">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pendingApps = applications.filter((a) => a.lifecycle_status === 'pending');
  const approvedApps = applications.filter((a) => a.lifecycle_status === 'approved');
  const rejectedApps = applications.filter((a) => a.lifecycle_status === 'rejected');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-4xl font-bold">Dealer Applications</h1>
          <p className="text-muted-foreground mt-2">
            Review and approve dealer registration requests
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={async () => {
            const res = await fetch('/api/admin/audit-dealer-applications');
            const audit = await res.json();
            console.log('=== FULL AUDIT REPORT ===');
            console.log(JSON.stringify(audit, null, 2));
            alert('Audit complete! Check browser console for full report.');
          }}
        >
          🔍 Run Audit
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex justify-between pb-2">
            <CardTitle className="text-sm">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingApps.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex justify-between pb-2">
            <CardTitle className="text-sm">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedApps.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex justify-between pb-2">
            <CardTitle className="text-sm">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rejectedApps.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Applications</CardTitle>
          <CardDescription>Click a row to review</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dealership</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No applications found
                  </TableCell>
                </TableRow>
              ) : (
                applications.map((app) => (
                  <TableRow
                    key={app.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedApp(app)}
                  >
                    <TableCell className="font-medium">
                      {app.legal_name || '—'}
                    </TableCell>
                    <TableCell>{app.contact_name || '—'}</TableCell>
                    <TableCell>
                      {app.city || '—'}, {app.region || '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{STATUS_LABEL_MAP[app.lifecycle_status]}</Badge>
                    </TableCell>
                    <TableCell>{formatDate(app.created_at)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog */}
      {selectedApp && (
        <Dialog open onOpenChange={() => setSelectedApp(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedApp.legal_name || 'Application Details'}</DialogTitle>
              <DialogDescription>
                Submitted {formatDate(selectedApp.created_at)}
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-6 text-sm">
              <div>
                <div className="font-semibold text-muted-foreground mb-1">Contact Name</div>
                <div>{selectedApp.contact_name || '—'}</div>
              </div>
              
              <div>
                <div className="font-semibold text-muted-foreground mb-1">Email</div>
                <div>{selectedApp.email || '—'}</div>
              </div>
              
              <div>
                <div className="font-semibold text-muted-foreground mb-1">Phone</div>
                <div>{selectedApp.phone || '—'}</div>
              </div>
              
              <div>
                <div className="font-semibold text-muted-foreground mb-1">Dealership Name</div>
                <div>{selectedApp.dealership_name || '—'}</div>
              </div>
              
              <div>
                <div className="font-semibold text-muted-foreground mb-1">Dealership Type</div>
                <div>{selectedApp.dealership_type || '—'}</div>
              </div>
              
              <div>
                <div className="font-semibold text-muted-foreground mb-1">Address</div>
                <div>{selectedApp.address || '—'}</div>
              </div>
              
              <div>
                <div className="font-semibold text-muted-foreground mb-1">City</div>
                <div>{selectedApp.city || '—'}</div>
              </div>
              
              <div>
                <div className="font-semibold text-muted-foreground mb-1">Region</div>
                <div>{selectedApp.region || '—'}</div>
              </div>
              
              <div>
                <div className="font-semibold text-muted-foreground mb-1">Country</div>
                <div>{selectedApp.country || '—'}</div>
              </div>
              
              <div>
                <div className="font-semibold text-muted-foreground mb-1">Status</div>
                <Badge variant="outline" className="mt-1">{STATUS_LABEL_MAP[selectedApp.status]}</Badge>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedApp(null)} disabled={approving}>
                Close
              </Button>
              {selectedApp.status !== 'approved' && (
                <Button
                  onClick={() => handleApprove(selectedApp.id)}
                  disabled={approving}
                  className={approving ? "opacity-50 cursor-not-allowed" : ""}
                >
                  {approving ? "Approving..." : "Approve Dealer"}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
