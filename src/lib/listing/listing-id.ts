/**
 * Listing ID Generation System
 * Format: CARLY-{REGION}-{MODE}-{YYYYMM}-{RANDOM}
 * IMMUTABLE: Generated once and never changes
 */

import { MarketplaceMode } from '@/types';

export type Region = 'CA' | 'US';

/**
 * Generate immutable Carly listing ID
 * Format: CARLY-CA-RR-202412-A7F3K
 */
export function generateCarlyListingId(
  region: Region,
  marketplaceMode: MarketplaceMode
): string {
  // Map mode to abbreviation
  const modeAbbrev = getModeAbbreviation(marketplaceMode);
  
  // Get current year and month
  const now = new Date();
  const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  // Generate random alphanumeric (5 chars)
  const random = generateRandomCode(5);
  
  return `CARLY-${region}-${modeAbbrev}-${yearMonth}-${random}`;
}

/**
 * Get mode abbreviation for listing ID
 */
function getModeAbbreviation(mode: MarketplaceMode): string {
  switch (mode) {
    case 'road-ready':
      return 'RR';
    case 'near-road-ready':
      return 'NRR';
    case 'builders-market':
      return 'BM';
    default:
      throw new Error(`Invalid marketplace mode: ${mode}`);
  }
}

/**
 * Generate random alphanumeric code
 */
function generateRandomCode(length: number): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude ambiguous chars
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

/**
 * Parse Carly listing ID to extract components
 */
export function parseCarlyListingId(carlyListingId: string): {
  valid: boolean;
  region?: Region;
  mode?: MarketplaceMode;
  yearMonth?: string;
  random?: string;
} {
  const pattern = /^CARLY-(CA|US)-(RR|NRR|BM)-(\d{6})-([A-Z0-9]{5})$/;
  const match = carlyListingId.match(pattern);
  
  if (!match) {
    return { valid: false };
  }
  
  const [, region, modeAbbrev, yearMonth, random] = match;
  
  // Map abbreviation back to full mode (keeping old format for backward compatibility)
  const modeMap: Record<string, MarketplaceMode> = {
    'RR': 'road-ready',
    'NRR': 'near-road-ready',
    'BM': 'builders-market'
  };
  
  return {
    valid: true,
    region: region as Region,
    mode: modeMap[modeAbbrev],
    yearMonth,
    random
  };
}

/**
 * Validate Carly listing ID format
 */
export function isValidCarlyListingId(carlyListingId: string): boolean {
  return parseCarlyListingId(carlyListingId).valid;
}
