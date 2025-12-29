/**
 * Generate sitemap for vehicle listings
 * Supports both Canada and United States
 */

import { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://carly.build';
  const supabase = createClient();

  // Get all active listings from public_listings view
  const { data: listings } = await supabase
    .from('public_listings')
    .select('id, year, make, model, dealership_city, published_at, created_at')
    .order('published_at', { ascending: false });

  // Generate listing URLs
  const listingUrls: MetadataRoute.Sitemap = (listings || []).map((listing) => {
    // Generate SEO-friendly slug: year-make-model-city-id
    const slug = `${listing.year}-${listing.make}-${listing.model}-${listing.dealership_city}-${listing.id}`
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');

    return {
      url: `${siteUrl}/cars/${slug}`,
      lastModified: listing.published_at || listing.created_at,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    };
  });

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${siteUrl}/browse`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/as-is-vehicles`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${siteUrl}/meet-carly`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${siteUrl}/how-carly-works`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${siteUrl}/trust-and-safety`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${siteUrl}/carly-verified`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ];

  return [...staticPages, ...listingUrls];
}
