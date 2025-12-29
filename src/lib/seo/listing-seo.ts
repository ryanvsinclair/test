/**
 * SEO utilities for vehicle listing pages
 * Country-aware for CA and US markets
 */

import { Vehicle } from '@/types';
import { formatVehicleMileage } from '@/lib/units';

export interface ListingSEOData {
  title: string;
  description: string;
  canonicalUrl: string;
  slug: string;
  jsonLd: Record<string, any>;
  openGraph: {
    title: string;
    description: string;
    image: string;
    url: string;
    type: string;
  };
  twitter: {
    card: string;
    title: string;
    description: string;
    image: string;
  };
}

/**
 * Build SEO-friendly URL slug for a vehicle listing
 */
export function buildListingSlug(vehicle: Vehicle): string {
  const country = getCountryFromLocation(vehicle.location);
  const { region, city } = parseLocation(vehicle.location);
  
  const citySlug = city.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const makeSlug = vehicle.make.toLowerCase().replace(/\s+/g, '-');
  const modelSlug = vehicle.model.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  
  return `/cars/${country}/${region}/${citySlug}/${vehicle.year}-${makeSlug}-${modelSlug}-${vehicle.listingId}`;
}

/**
 * Parse slug to extract country, region, city, and listingId
 */
export function parseListingSlug(slug: string): {
  country: string;
  region: string;
  city: string;
  listingId: number;
} | null {
  const match = slug.match(/^\/cars\/([a-z]{2})\/([a-z]{2})\/([a-z0-9-]+)\/\d{4}-[a-z0-9-]+-(\d+)$/i);
  
  if (!match) return null;
  
  return {
    country: match[1].toLowerCase(),
    region: match[2].toLowerCase(),
    city: match[3],
    listingId: parseInt(match[4], 10),
  };
}

/**
 * Extract country code from location string
 */
function getCountryFromLocation(location: string): string {
  // Location format: "City, Province/State"
  // Check common Canadian provinces
  const canadianProvinces = ['ON', 'QC', 'BC', 'AB', 'MB', 'SK', 'NS', 'NB', 'NL', 'PE', 'NT', 'YT', 'NU'];
  const parts = location.split(',').map(p => p.trim());
  const region = parts[parts.length - 1];
  
  if (canadianProvinces.includes(region.toUpperCase())) {
    return 'ca';
  }
  
  return 'us'; // Default to US for state abbreviations
}

/**
 * Parse city and region from location string
 */
function parseLocation(location: string): { region: string; city: string } {
  const parts = location.split(',').map(p => p.trim());
  const city = parts[0] || 'Unknown';
  const region = parts[1]?.toLowerCase() || 'unknown';
  
  return { city, region };
}

/**
 * Get region full name for display
 */
function getRegionFullName(region: string, country: string): string {
  const canadianProvinces: Record<string, string> = {
    'on': 'Ontario',
    'qc': 'Quebec',
    'bc': 'British Columbia',
    'ab': 'Alberta',
    'mb': 'Manitoba',
    'sk': 'Saskatchewan',
    'ns': 'Nova Scotia',
    'nb': 'New Brunswick',
    'nl': 'Newfoundland and Labrador',
    'pe': 'Prince Edward Island',
    'nt': 'Northwest Territories',
    'yt': 'Yukon',
    'nu': 'Nunavut',
  };
  
  const usStates: Record<string, string> = {
    'ca': 'California',
    'ny': 'New York',
    'tx': 'Texas',
    'fl': 'Florida',
    'il': 'Illinois',
    'pa': 'Pennsylvania',
    'oh': 'Ohio',
    'ga': 'Georgia',
    'nc': 'North Carolina',
    'mi': 'Michigan',
  };
  
  if (country === 'ca') {
    return canadianProvinces[region] || region.toUpperCase();
  }
  
  return usStates[region] || region.toUpperCase();
}

/**
 * Generate complete SEO metadata for a vehicle listing
 */
export function generateListingSEO(vehicle: Vehicle): ListingSEOData {
  const country = getCountryFromLocation(vehicle.location);
  const { region, city } = parseLocation(vehicle.location);
  const slug = buildListingSlug(vehicle);
  
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://carly.build';
  const canonicalUrl = `${siteUrl}${slug}`;
  
  // Format mileage with proper units
  const mileageFormatted = formatVehicleMileage(vehicle.mileage, vehicle.location);
  
  // SEO Title
  const title = `${vehicle.year} ${vehicle.make} ${vehicle.model} for Sale | ${city}, ${region.toUpperCase()} | Carly`;
  
  // Meta Description
  const description = `Explore this ${vehicle.year} ${vehicle.make} ${vehicle.model} in ${city}, ${region.toUpperCase()}. ${mileageFormatted}. Verified seller. View photos and details on Carly.`;
  
  // Primary image
  const image = vehicle.images[0] || 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=1200&q=80';
  
  // JSON-LD Structured Data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Car',
    name: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
    brand: {
      '@type': 'Brand',
      name: vehicle.make,
    },
    model: vehicle.model,
    vehicleModelDate: vehicle.year.toString(),
    mileageFromOdometer: {
      '@type': 'QuantitativeValue',
      value: vehicle.mileage,
      unitCode: country === 'ca' ? 'KMT' : 'SMI', // KMT = kilometers, SMI = miles
    },
    image: vehicle.images,
    description: vehicle.description,
    vehicleTransmission: vehicle.transmission,
    fuelType: vehicle.fuelType,
    bodyType: vehicle.bodyType,
    color: vehicle.exteriorColor,
    vehicleInteriorColor: vehicle.interiorColor,
    itemCondition: vehicle.condition === 'new' 
      ? 'https://schema.org/NewCondition' 
      : 'https://schema.org/UsedCondition',
    offers: {
      '@type': 'Offer',
      price: vehicle.price.toString(),
      priceCurrency: country === 'ca' ? 'CAD' : 'USD',
      availability: 'https://schema.org/InStock',
      url: canonicalUrl,
      seller: {
        '@type': vehicle.sellerType === 'dealer' ? 'AutoDealer' : 'Organization',
        name: vehicle.sellerName,
        address: vehicle.dealerInfo ? {
          '@type': 'PostalAddress',
          addressLocality: vehicle.dealerInfo.city,
          addressRegion: vehicle.dealerInfo.region,
          addressCountry: vehicle.dealerInfo.country,
        } : undefined,
      },
    },
  };
  
  // Open Graph
  const openGraph = {
    title,
    description,
    image,
    url: canonicalUrl,
    type: 'product',
  };
  
  // Twitter Card
  const twitter = {
    card: 'summary_large_image',
    title,
    description,
    image,
  };
  
  return {
    title,
    description,
    canonicalUrl,
    slug,
    jsonLd,
    openGraph,
    twitter,
  };
}

/**
 * Generate image alt text for SEO
 */
export function generateImageAlt(vehicle: Vehicle, imageIndex: number = 0): string {
  const views = ['front view', 'side view', 'rear view', 'interior view', 'detail shot'];
  const view = views[imageIndex] || `image ${imageIndex + 1}`;
  
  return `${vehicle.year} ${vehicle.make} ${vehicle.model} ${view} – Carly listing`;
}
