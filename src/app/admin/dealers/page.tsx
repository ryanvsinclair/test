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
  TableRow 
} from '@/components/ui/table';
import { 
  ArrowLeft,
  ArrowRight
} from 'lucide-react';

interface Dealer {
  id: string;
  email: string;
  dealership_name?: string;
  reputation_score?: number;
  created_at: string;
  [key: string]: any;
}

export default function DealerMetricsPage() {
  const router = useRouter();
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDealers();
  }, []);

  async function loadDealers() {
    try {
      const res = await fetch('/api/admin/dealers', {
        cache: 'no-store',
      });

      if (!res.ok) {
        throw new Error('Failed to fetch dealers');
      }

      const { dealers: data } = await res.json();
      setDealers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dealers');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-muted-foreground">Loading dealers...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="text-destructive">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-4xl font-bold">Dealers</h1>
          <p className="text-muted-foreground mt-2">
            {dealers.length} registered dealers
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dealer List</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dealership</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Reputation</TableHead>
                <TableHead>Created</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dealers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No dealers found
                  </TableCell>
                </TableRow>
              ) : (
                dealers.map((dealer) => (
                  <TableRow 
                    key={dealer.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/admin/dealers/${dealer.id}`)}
                  >
                    <TableCell className="font-medium">
                      {dealer.dealership_name || 'Unnamed'}
                    </TableCell>
                    <TableCell>{dealer.email}</TableCell>
                    <TableCell>
                      {dealer.reputation_score ? (
                        <Badge variant="secondary">
                          {dealer.reputation_score.toFixed(1)}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(dealer.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/admin/dealers/${dealer.id}`);
                        }}
                      >
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
