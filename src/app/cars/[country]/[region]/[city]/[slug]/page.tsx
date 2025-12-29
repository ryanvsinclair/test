/**
 * Dynamic route handler for country-aware vehicle listings
 * Route: /cars/[country]/[region]/[city]/[slug]
 * 
 * Examples:
 * - /cars/ca/on/toronto/2024-bmw-m4-competition-1098109
 * - /cars/us/ca/los-angeles/2022-tesla-model-s-plaid-331090
 */

'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Vehicle } from '@/types';
// Mock data removed - connect to real database
import { parseListingSlug } from '@/lib/seo/listing-seo';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function SEOListingPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Extract listingId from slug
    const slug = params.slug as string;
    const match = slug.match(/-(\d+)$/);
    
    if (match) {
      const listingId = match[1];
      // Redirect to the canonical listing page
      router.replace(`/listings/${listingId}`);
    } else {
      setLoading(false);
    }
  }, [params, router]);

  if (loading) {
    return (
      <div className="min-h-screen">
        <Skeleton className="h-[60vh] w-full" />
        <div className="max-w-6xl mx-auto px-6 py-12">
          <Skeleton className="h-12 w-2/3 mb-4" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl font-light mb-4">Listing not found</h1>
        <p className="text-muted-foreground mb-8">
          This listing may have been removed or is no longer available.
        </p>
        <Link href="/">
          <Button>Browse all listings</Button>
        </Link>
      </div>
    </div>
  );
}
