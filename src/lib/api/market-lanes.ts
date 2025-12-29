/**
 * Market Lane Classification System (AWS-Ready)
 * 
 * Enforces strict separation between Primary Market (Browse) and Secondary Market (As-Is/Project)
 * All classification logic runs server-side and cannot be bypassed by client
 */

import { Vehicle, AsIsDisclosure, MarketLane } from '@/types';

export interface VehicleMarketClassification {
  marketLane: MarketLane;
  roadReady: boolean;
  inspected: boolean;
  runningStatus: 'running' | 'not_running' | 'unknown';
  disqualificationReasons?: string[];
}

export interface CreateListingData {
  // Basic vehicle info
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  description: string;
  
  // Market lane determination
  intendedMarketLane: MarketLane; // Seller's choice
  roadReady: boolean;
  inspected: boolean;
  runningStatus: 'running' | 'not_running' | 'unknown';
  
  // Required for secondary market
  asIsDisclosure?: AsIsDisclosure;
}

export interface ReclassificationRequest {
  listingId: string;
  currentLane: MarketLane;
  requestedLane: MarketLane;
  reason: string;
  supportingData: {
    roadReady?: boolean;
    inspected?: boolean;
    runningStatus?: 'running' | 'not_running' | 'unknown';
    newConditionDetails?: string;
  };
}

/**
 * CRITICAL: Server-side market lane classification
 * Determines which market lane a vehicle belongs to based on condition
 * 
 * Rules:
 * - Primary market ONLY if: roadReady=true AND inspected=true AND running AND no critical issues
 * - Otherwise: Secondary market (mandatory)
 */
export function classifyVehicleMarketLane(
  data: Partial<CreateListingData>
): VehicleMarketClassification {
  const disqualificationReasons: string[] = [];
  
  // Check road readiness
  if (!data.roadReady) {
    disqualificationReasons.push('Vehicle is not road-ready');
  }
  
  // Check inspection status
  if (!data.inspected) {
    disqualificationReasons.push('Vehicle has not been inspected');
  }
  
  // Check running status
  if (data.runningStatus === 'not_running') {
    disqualificationReasons.push('Vehicle is not running');
  }
  
  // Check for critical disclosures
  if (data.asIsDisclosure) {
    if (data.asIsDisclosure.notRunning) {
      disqualificationReasons.push('Seller disclosed: Vehicle not running');
    }
    if (data.asIsDisclosure.mechanicalIssues) {
      disqualificationReasons.push('Seller disclosed: Mechanical issues');
    }
    if (data.asIsDisclosure.electricalIssues) {
      disqualificationReasons.push('Seller disclosed: Electrical issues');
    }
    if (data.asIsDisclosure.structuralDamage) {
      disqualificationReasons.push('Seller disclosed: Structural damage');
    }
  }
  
  // Determine final market lane
  const qualifiesForPrimary = 
    data.roadReady === true &&
    data.inspected === true &&
    data.runningStatus !== 'not_running' &&
    disqualificationReasons.length === 0;
  
  return {
    marketLane: qualifiesForPrimary ? 'primary' : 'secondary',
    roadReady: data.roadReady || false,
    inspected: data.inspected || false,
    runningStatus: data.runningStatus || 'unknown',
    disqualificationReasons: disqualificationReasons.length > 0 ? disqualificationReasons : undefined
  };
}

/**
 * Validate listing data before creation
 */
export function validateListingData(data: CreateListingData): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Basic validation
  if (!data.make || !data.model || !data.year) {
    errors.push('Make, model, and year are required');
  }
  
  if (!data.price || data.price <= 0) {
    errors.push('Valid price is required');
  }
  
  // Market lane specific validation
  const classification = classifyVehicleMarketLane(data);
  
  if (classification.marketLane === 'secondary') {
    // Secondary market MUST have disclosures
    if (!data.asIsDisclosure) {
      errors.push('As-Is disclosures are required for secondary market vehicles');
    } else {
      // At least one disclosure must be selected
      const hasDisclosure = Object.entries(data.asIsDisclosure).some(([key, value]) => {
        if (key === 'customDescription') return false;
        return value === true;
      });
      
      if (!hasDisclosure) {
        errors.push('At least one disclosure must be selected for secondary market vehicles');
      }
    }
  }
  
  if (data.intendedMarketLane === 'primary' && classification.marketLane === 'secondary') {
    errors.push(`Vehicle does not qualify for primary market. Reasons: ${classification.disqualificationReasons?.join(', ')}`);
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Create vehicle listing with automatic market lane classification
 */
export async function createVehicleListing(
  data: CreateListingData,
  sellerId: string
): Promise<{ success: boolean; listingId?: string; marketLane?: MarketLane; error?: string }> {
  try {
    // Validate data
    const validation = validateListingData(data);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.errors.join('; ')
      };
    }
    
    // Classify vehicle (server-side, cannot be overridden)
    const classification = classifyVehicleMarketLane(data);
    
    // TODO: Replace with actual database mutation
    // Example:
    // const { data: listing, error } = await supabase
    //   .from('vehicle_listings')
    //   .insert({
    //     make: data.make,
    //     model: data.model,
    //     year: data.year,
    //     price: data.price,
    //     market_lane: classification.marketLane,
    //     road_ready: classification.roadReady,
    //     inspected: classification.inspected,
    //     running_status: classification.runningStatus,
    //     seller_id: sellerId,
    //     condition: classification.marketLane === 'primary' ? 'used' : 'as_is'
    //   })
    //   .select()
    //   .single();
    //
    // if (data.asIsDisclosure) {
    //   await supabase
    //     .from('as_is_disclosures')
    //     .insert({
    //       listing_id: listing.listing_id,
    //       ...data.asIsDisclosure
    //     });
    // }
    
    console.log('[MARKET LANE] Creating listing:', {
      sellerId,
      classification,
      hasDisclosures: !!data.asIsDisclosure
    });
    
    return {
      success: true,
      listingId: 'mock-listing-id',
      marketLane: classification.marketLane
    };
  } catch (error: unknown) {
    console.error('[MARKET LANE] Failed to create listing:', error);
    return {
      success: false,
      error: 'Failed to create listing'
    };
  }
}

/**
 * Request reclassification (secondary → primary)
 * Requires approval process
 */
export async function requestReclassification(
  request: ReclassificationRequest,
  sellerId: string
): Promise<{ success: boolean; requestId?: string; error?: string }> {
  try {
    // Only allow secondary → primary requests
    if (request.currentLane !== 'secondary' || request.requestedLane !== 'primary') {
      return {
        success: false,
        error: 'Reclassification only allowed from secondary to primary market'
      };
    }
    
    // Validate new condition qualifies for primary
    const classification = classifyVehicleMarketLane({
      roadReady: request.supportingData.roadReady,
      inspected: request.supportingData.inspected,
      runningStatus: request.supportingData.runningStatus
    });
    
    if (classification.marketLane !== 'primary') {
      return {
        success: false,
        error: `Vehicle still does not qualify for primary market: ${classification.disqualificationReasons?.join(', ')}`
      };
    }
    
    // TODO: Replace with actual database mutation
    // Example:
    // const { data, error } = await supabase
    //   .from('market_lane_reclassification_requests')
    //   .insert({
    //     listing_id: request.listingId,
    //     current_lane: request.currentLane,
    //     requested_lane: request.requestedLane,
    //     seller_id: sellerId,
    //     reason: request.reason,
    //     supporting_data: request.supportingData,
    //     status: 'pending'
    //   })
    //   .select()
    //   .single();
    
    console.log('[MARKET LANE] Reclassification requested:', {
      listingId: request.listingId,
      sellerId,
      classification
    });
    
    return {
      success: true,
      requestId: 'mock-request-id'
    };
  } catch (error: unknown) {
    console.error('[MARKET LANE] Failed to request reclassification:', error);
    return {
      success: false,
      error: 'Failed to submit reclassification request'
    };
  }
}

/**
 * Get vehicles by market lane (for queries)
 * CRITICAL: Always filter by market lane server-side
 */
export async function getVehiclesByMarketLane(
  marketLane: MarketLane,
  filters?: Record<string, any>
): Promise<Vehicle[]> {
  try {
    // TODO: Replace with actual database query
    // Example:
    // const { data, error } = await supabase
    //   .from('vehicle_listings')
    //   .select('*')
    //   .eq('market_lane', marketLane)
    //   .order('created_at', { ascending: false });
    
    console.log('[MARKET LANE] Fetching vehicles for lane:', marketLane, filters);
    
    return [];
  } catch (error: unknown) {
    console.error('[MARKET LANE] Failed to fetch vehicles:', error);
    return [];
  }
}

/**
 * CRITICAL: Get primary market filter for Browse
 * Use this to ensure Browse ONLY shows primary market vehicles
 */
export function getPrimaryMarketFilter() {
  return {
    market_lane: 'primary',
    road_ready: true,
    inspected: true,
    running_status: { $ne: 'not_running' }
  };
}

/**
 * Get secondary market filter for As-Is section
 */
export function getSecondaryMarketFilter() {
  return {
    market_lane: 'secondary'
  };
}
