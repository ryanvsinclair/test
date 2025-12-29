"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface Listing {
  id: string;
  year: number;
  make: string;
  model: string;
  price: number;
  vehicle_state?: string;
  created_at: string;
  [key: string]: any;
}

export default function AdminListingsPage() {
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedState, setSelectedState] = useState<string>('all');

  useEffect(() => {
    loadListings(selectedState);
  }, [selectedState]);

  async function loadListings(state: string) {
    setLoading(true);
    try {
      const url = state === 'all' 
        ? '/api/admin/listings'
        : `/api/admin/listings?vehicle_state=${state}`;
        
      const res = await fetch(url, {
        cache: 'no-store',
      });

      if (!res.ok) {
        throw new Error('Failed to fetch listings');
      }

      const { listings: data } = await res.json();
      setListings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load listings');
    } finally {
      setLoading(false);
    }
  }

  const states = [
    'all',
    'personal_use',
    'ready_to_trade',
    'active_shopper',
    'dealer_certified',
    'carly_certified'
  ];

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
          <h1 className="text-4xl font-bold">Listings</h1>
          <p className="text-muted-foreground mt-2">
            {listings.length} total listings
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Listings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={selectedState} onValueChange={setSelectedState}>
            <TabsList className="grid w-full grid-cols-6">
              {states.map((state) => (
                <TabsTrigger key={state} value={state}>
                  {state === 'all' ? 'All' : state.replace(/_/g, ' ')}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Loading...</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>State</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {listings.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No listings found
                      </TableCell>
                    </TableRow>
                  ) : (
                    listings.map((listing) => (
                      <TableRow key={listing.id}>
                        <TableCell className="font-medium">
                          {listing.year} {listing.make} {listing.model}
                        </TableCell>
                        <TableCell>
                          ${listing.price?.toLocaleString() || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {listing.vehicle_state?.replace(/_/g, ' ') || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {new Date(listing.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {listing.id.substring(0, 8)}...
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
