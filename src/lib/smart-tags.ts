/**
 * Smart Tags System
 * 
 * Hard-data driven, intelligent signals computed from listing data.
 * These are NEVER manually set and are separate from status/source tags.
 */

import { Vehicle } from '@/types';

// Tag Categories
export type StatusTag = 'Dealer' | 'Private Seller' | 'Certified' | 'Carly Verified';
export type SmartTag = 
  | 'Low Mileage' 
  | 'Very Low Mileage' 
  | 'Above Average Use'
  | 'Older, Low Mileage'
  | 'Newer, High Mileage'
  | 'Fresh Listing'
  | 'Price Drop'
  | 'High Interest'
  | 'Trending';

export interface TagSet {
  status: StatusTag[];
  smart: SmartTag[];
}

// Regional driving averages (canonical kilometers)
const ANNUAL_MILEAGE_KM = {
  CA: 15000,
  US: 19312, // 12,000 miles converted to km
};

/**
 * Infer country from location string
 */
function inferCountryFromLocation(location: string): 'CA' | 'US' {
  if (!location) return 'CA';
  
  const locationUpper = location.toUpperCase();
  
  const usStates = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ];
  
  const canadianProvinces = ['ON', 'BC', 'AB', 'QC', 'MB', 'SK', 'NS', 'NB', 'PE', 'NL', 'NT', 'YT', 'NU'];
  
  for (const state of usStates) {
    if (locationUpper.includes(` ${state}`) || locationUpper.endsWith(state)) {
      return 'US';
    }
  }
  
  for (const province of canadianProvinces) {
    if (locationUpper.includes(` ${province}`) || locationUpper.endsWith(province)) {
      return 'CA';
    }
  }
  
  return 'CA';
}

/**
 * Calculate expected mileage based on vehicle age and regional averages
 */
function calculateExpectedMileage(vehicle: Vehicle): number {
  const currentYear = new Date().getFullYear();
  const age = currentYear - vehicle.year;
  const country = inferCountryFromLocation(vehicle.location);
  const annualMileage = ANNUAL_MILEAGE_KM[country];
  
  return age * annualMileage;
}

/**
 * Generate status tags from vehicle metadata
 */
export function generateStatusTags(vehicle: Vehicle): StatusTag[] {
  const tags: StatusTag[] = [];
  
  // Removed dealer/private seller tags - dealer info is shown prominently in dealer card
  
  if (vehicle.condition === 'certified') {
    tags.push('Certified');
  }
  
  if (vehicle.carlyVerified) {
    tags.push('Carly Verified');
  }
  
  return tags;
}

/**
 * Generate smart tags from vehicle data
 * Limits to 2-4 tags max, prioritizes strongest signals
 */
export function generateSmartTags(vehicle: Vehicle): SmartTag[] {
  const tags: SmartTag[] = [];
  const expectedMileage = calculateExpectedMileage(vehicle);
  const country = inferCountryFromLocation(vehicle.location);
  const annualMileage = ANNUAL_MILEAGE_KM[country];
  const currentYear = new Date().getFullYear();
  const age = currentYear - vehicle.year;
  
  // Mileage Intelligence
  const mileageDiff = expectedMileage - vehicle.mileage;
  
  // Very Low Mileage (2+ years under expected)
  if (mileageDiff >= (2 * annualMileage)) {
    tags.push('Very Low Mileage');
  }
  // Low Mileage (1+ year under expected)
  else if (mileageDiff >= annualMileage) {
    tags.push('Low Mileage');
  }
  // Above Average Use (1+ year over expected)
  else if (mileageDiff <= -annualMileage) {
    tags.push('Above Average Use');
  }
  
  // Age vs Usage Signals (only if no direct mileage tag)
  if (tags.length === 0) {
    // Older, Low Mileage (age > 5 and mileage notably under expected)
    if (age > 5 && mileageDiff >= (0.5 * annualMileage)) {
      tags.push('Older, Low Mileage');
    }
    // Newer, High Mileage (age < 3 and mileage notably over expected)
    else if (age < 3 && mileageDiff <= (-0.5 * annualMileage)) {
      tags.push('Newer, High Mileage');
    }
  }
  
  // Market & Activity Signals
  
  // Fresh Listing (listed within 7 days)
  const listingDate = new Date(vehicle.createdAt);
  const daysSinceListing = Math.floor((Date.now() - listingDate.getTime()) / (1000 * 60 * 60 * 24));
  if (daysSinceListing <= 7) {
    tags.push('Fresh Listing');
  }
  
  // Price Drop (≥5% or ≥$500 reduction)
  if (vehicle.priceHistory && vehicle.priceHistory.length > 1) {
    const originalPrice = vehicle.priceHistory[0].price;
    const currentPrice = vehicle.price;
    const priceDrop = originalPrice - currentPrice;
    const dropPercentage = (priceDrop / originalPrice) * 100;
    
    if (dropPercentage >= 5 || priceDrop >= 500) {
      tags.push('Price Drop');
    }
  }
  
  // High Interest (save count above threshold)
  // Assume average listing gets ~5-10 saves
  if (vehicle.saveCount && vehicle.saveCount >= 15) {
    tags.push('High Interest');
  }
  
  // Trending (view velocity - views per day above average)
  // Assume average listing gets ~20-30 views per day
  if (vehicle.viewCount && daysSinceListing > 0) {
    const viewsPerDay = vehicle.viewCount / daysSinceListing;
    if (viewsPerDay >= 50) {
      tags.push('Trending');
    }
  }
  
  // Limit to 4 tags max, prioritize by impact
  // Priority: Price Drop > Very Low Mileage > Fresh Listing > High Interest > others
  const priorityOrder: SmartTag[] = [
    'Price Drop',
    'Very Low Mileage',
    'Fresh Listing',
    'High Interest',
    'Trending',
    'Low Mileage',
    'Older, Low Mileage',
    'Newer, High Mileage',
    'Above Average Use',
  ];
  
  const sortedTags = tags.sort((a, b) => {
    return priorityOrder.indexOf(a) - priorityOrder.indexOf(b);
  });
  
  return sortedTags.slice(0, 4);
}

/**
 * Generate all tags for a vehicle
 */
export function generateVehicleTags(vehicle: Vehicle): TagSet {
  return {
    status: generateStatusTags(vehicle),
    smart: generateSmartTags(vehicle),
  };
}

/**
 * Get tag color/style for rendering
 */
export function getTagStyle(tag: StatusTag | SmartTag, type: 'status' | 'smart'): {
  bgColor: string;
  textColor: string;
  borderColor?: string;
} {
  if (type === 'status') {
    // Neutral, subtle styling for status tags
    return {
      bgColor: 'hsl(var(--muted))',
      textColor: 'hsl(var(--muted-foreground))',
    };
  }
  
  // Smart tags - more expressive, gradient-based
  const smartTagColors: Record<SmartTag, { bgColor: string; textColor: string }> = {
    'Very Low Mileage': {
      bgColor: 'hsl(var(--accent-primary) / 0.1)',
      textColor: 'hsl(var(--accent-primary))',
    },
    'Low Mileage': {
      bgColor: 'hsl(var(--accent-primary) / 0.1)',
      textColor: 'hsl(var(--accent-primary))',
    },
    'Above Average Use': {
      bgColor: 'hsl(var(--muted))',
      textColor: 'hsl(var(--muted-foreground))',
    },
    'Older, Low Mileage': {
      bgColor: 'hsl(var(--accent-secondary) / 0.1)',
      textColor: 'hsl(var(--accent-secondary))',
    },
    'Newer, High Mileage': {
      bgColor: 'hsl(var(--muted))',
      textColor: 'hsl(var(--muted-foreground))',
    },
    'Fresh Listing': {
      bgColor: 'hsl(142 70% 15% / 0.2)',
      textColor: 'hsl(142 60% 55%)',
    },
    'Price Drop': {
      bgColor: 'hsl(var(--accent-primary) / 0.15)',
      textColor: 'hsl(var(--accent-primary))',
    },
    'High Interest': {
      bgColor: 'hsl(var(--accent-secondary) / 0.1)',
      textColor: 'hsl(var(--accent-secondary))',
    },
    'Trending': {
      bgColor: 'hsl(var(--accent-secondary) / 0.1)',
      textColor: 'hsl(var(--accent-secondary))',
    },
  };
  
  return smartTagColors[tag as SmartTag] || {
    bgColor: 'hsl(var(--muted))',
    textColor: 'hsl(var(--muted-foreground))',
  };
}
