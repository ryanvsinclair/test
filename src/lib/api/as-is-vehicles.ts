/**
 * AS-IS / Project Vehicles API (AWS-Ready)
 * 
 * Handles non-running, uninspected, and project vehicles
 * STRICT SEPARATION from main marketplace
 */

import { Vehicle, AsIsDisclosure } from '@/types';

export interface AsIsVehicleFilters {
  runningStatus?: 'running' | 'not_running' | 'unknown';
  priceMin?: number;
  priceMax?: number;
  make?: string;
  year?: number;
  location?: string;
  sortBy?: 'newest' | 'price_asc' | 'price_desc' | 'location';
}

/**
 * Fetch AS-IS / Project vehicles ONLY
 * NEVER includes these in main Browse
 */
export async function getAsIsVehicles(
  filters: AsIsVehicleFilters = {}
): Promise<Vehicle[]> {
  try {
    // TODO: Replace with actual database query
    // Example:
    // const { data, error } = await supabase
    //   .from('vehicle_listings')
    //   .select('*, as_is_disclosures(*)')
    //   .eq('market_lane', 'secondary') // CRITICAL: Only secondary market
    //   .order(filters.sortBy || 'created_at', { ascending: false });
    
    console.log('[AS-IS API] Fetching AS-IS vehicles (secondary market) with filters:', filters);
    
    // TEMPORARY: Return empty array
    return [];
  } catch (error) {
    console.error('[AS-IS API] Failed to fetch AS-IS vehicles:', error);
    return [];
  }
}

/**
 * Get AS-IS vehicle by ID
 */
export async function getAsIsVehicleById(listingId: string): Promise<Vehicle | null> {
  try {
    // TODO: Replace with actual database query
    // Example:
    // const { data, error } = await supabase
    //   .from('vehicle_listings')
    //   .select('*, as_is_disclosures(*)')
    //   .eq('listing_id', listingId)
    //   .eq('market_lane', 'secondary') // CRITICAL: Only secondary market
    //   .single();
    
    console.log('[AS-IS API] Fetching AS-IS vehicle (secondary market):', listingId);
    
    return null;
  } catch (error) {
    console.error('[AS-IS API] Failed to fetch AS-IS vehicle:', error);
    return null;
  }
}

/**
 * Create AS-IS vehicle listing
 * Requires disclosure validation
 */
export async function createAsIsListing(
  vehicleData: Partial<Vehicle>,
  disclosure: AsIsDisclosure,
  userId: string
): Promise<{ success: boolean; listingId?: string; error?: string }> {
  // Validate disclosure - at least one must be true
  const hasDisclosure = Object.entries(disclosure).some(([key, value]) => {
    if (key === 'customDescription') return false;
    return value === true;
  });
  
  if (!hasDisclosure) {
    return {
      success: false,
      error: 'At least one disclosure is required for AS-IS vehicles'
    };
  }
  
  try {
    // TODO: Replace with actual database mutation
    // Example:
    // 1. Create vehicle listing with condition = 'as_is', road_ready = false
    // 2. Create as_is_disclosures record
    // 3. Link to seller
    
    console.log('[AS-IS API] Creating AS-IS listing:', {
      vehicleData,
      disclosure,
      userId
    });
    
    return {
      success: true,
      listingId: 'mock-listing-id'
    };
  } catch (error: unknown) {
    console.error('[AS-IS API] Failed to create AS-IS listing:', error);
    return {
      success: false,
      error: 'Failed to create AS-IS listing'
    };
  }
}

/**
 * Check if user has acknowledged AS-IS disclaimer
 */
export async function hasUserAcknowledgedAsIs(userId: string): Promise<boolean> {
  try {
    // TODO: Replace with actual database query
    // Example:
    // const { data, error } = await supabase
    //   .from('user_as_is_acknowledgments')
    //   .select('user_id')
    //   .eq('user_id', userId)
    //   .single();
    
    console.log('[AS-IS API] Checking acknowledgment for user:', userId);
    
    return false; // Default to false (show disclaimer)
  } catch (error) {
    console.error('[AS-IS API] Failed to check acknowledgment:', error);
    return false;
  }
}

/**
 * Record user acknowledgment of AS-IS disclaimer
 */
export async function recordAsIsAcknowledgment(
  userId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<boolean> {
  try {
    // TODO: Replace with actual database mutation
    // Example:
    // const { error } = await supabase
    //   .from('user_as_is_acknowledgments')
    //   .upsert({
    //     user_id: userId,
    //     acknowledged_at: new Date().toISOString(),
    //     ip_address: ipAddress,
    //     user_agent: userAgent
    //   });
    
    console.log('[AS-IS API] Recording acknowledgment:', {
      userId,
      ipAddress,
      userAgent
    });
    
    return true;
  } catch (error: unknown) {
    console.error('[AS-IS API] Failed to record acknowledgment:', error);
    return false;
  }
}

/**
 * CRITICAL: Ensure AS-IS vehicles NEVER appear in main Browse
 * This filter should be applied server-side to ALL main Browse queries
 */
export function getMainBrowseExclusionFilter() {
  return {
    market_lane: 'primary', // ONLY primary market
    road_ready: true,
    inspected: true,
    running_status: { $ne: 'not_running' }
  };
}

/**
 * Validate disclosure completeness
 */
export function validateAsIsDisclosure(disclosure: AsIsDisclosure): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // At least one disclosure must be selected
  const hasDisclosure = Object.entries(disclosure).some(([key, value]) => {
    if (key === 'customDescription') return false;
    return value === true;
  });
  
  if (!hasDisclosure) {
    errors.push('At least one disclosure reason must be selected');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
