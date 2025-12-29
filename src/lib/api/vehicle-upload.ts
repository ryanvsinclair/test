/**
 * Vehicle Upload / Listing Creation with Marketplace Mode Selection
 * AWS-Ready with server-side validation
 */

import { MarketplaceMode, IssueSeverity, IntendedUse } from '@/types';
import { generateCarlyListingId, Region } from '@/lib/listing/listing-id';
import { 
  qualifiesAsNewInventory,
  canTransitionToState,
  ROAD_READINESS_STATES
} from '@/lib/marketplace/roadReadinessStates';

export interface VehicleUploadData {
  // Basic vehicle info
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  description: string;
  images: File[];
  region: Region; // REQUIRED for listing ID generation
  
  // Vehicle condition
  condition: 'new' | 'used' | 'certified';
  
  // REQUIRED: Marketplace mode selection
  marketplaceMode: MarketplaceMode;
  
  // Condition fields (all required)
  running: boolean;
  issueSeverity: IssueSeverity;
  
  // New Inventory detection
  explicitlyMarkedNew?: boolean;
  sellerType: 'private' | 'dealer';
  
  // Mode-specific fields
  inspectionFile?: File; // Required for Road Ready, optional for Near Road Ready
  inspectionUploaded: boolean;
  estimatedFixes?: string[]; // Required for Near Road Ready
  intendedUse?: IntendedUse[]; // Required for Builder's Market
  disclosureAcknowledged?: boolean; // Required for Builder's Market
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * CRITICAL: Server-side validation for marketplace mode requirements
 * Cannot be bypassed by client
 */
export function validateMarketplaceModeRequirements(
  data: VehicleUploadData
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // FIRST: Check if vehicle qualifies as New Inventory
  const isNewInventory = qualifiesAsNewInventory({
    condition: data.condition,
    mileage: data.mileage,
    sellerType: data.sellerType,
    explicitlyMarkedNew: data.explicitlyMarkedNew
  });
  
  // NEW INVENTORY VALIDATION
  if (isNewInventory) {
    // New Inventory cannot have Carly Verified requirements
    if (data.marketplaceMode === 'road-ready') {
      errors.push('New vehicles cannot be marked as Carly Verified. They must use the New Inventory state.');
    }
    
    // New Inventory does not require inspection
    if (data.inspectionUploaded || data.inspectionFile) {
      warnings.push('New vehicles do not require inspection documentation.');
    }
    
    return { valid: errors.length === 0, errors, warnings };
  }
  
  // Validate based on selected marketplace mode
  // NOTE: This uses legacy MarketplaceMode type (hyphenated) for backward compatibility
  // Internally maps to RoadReadinessState (underscore)
  switch (data.marketplaceMode) {
    case 'road-ready':
      // MUST be running
      if (!data.running) {
        errors.push('Carly Verified vehicles must be running');
      }
      
      // MUST have inspection uploaded
      if (!data.inspectionUploaded && !data.inspectionFile) {
        errors.push('Carly Verified vehicles must have an inspection uploaded');
      }
      
      // Issue severity MUST be none or minor
      if (data.issueSeverity !== 'none' && data.issueSeverity !== 'minor') {
        errors.push('Carly Verified vehicles can only have "none" or "minor" issues');
      }
      
      // CANNOT be new
      if (data.condition === 'new') {
        errors.push('New vehicles cannot be Carly Verified');
      }
      break;
      
    case 'near-road-ready':
      // MUST be running
      if (!data.running) {
        errors.push('The Hub vehicles must be running');
      }
      
      // Issue severity MUST be minor
      if (data.issueSeverity !== 'minor') {
        errors.push('The Hub vehicles must have "minor" issue severity');
      }
      
      // MUST have estimated fixes
      if (!data.estimatedFixes || data.estimatedFixes.length === 0) {
        errors.push('The Hub vehicles must have at least one estimated fix listed');
      }
      
      // Encourage inspection upload
      if (!data.inspectionUploaded && !data.inspectionFile) {
        warnings.push('Consider uploading an inspection to increase buyer confidence');
      }
      break;
      
    case 'builders-market':
      // MUST meet at least ONE of: non-running, no inspection, or project intent
      const meetsBuildersCriteria = 
        !data.running ||
        (!data.inspectionUploaded && !data.inspectionFile) ||
        (data.intendedUse && data.intendedUse.length > 0);
        
      if (!meetsBuildersCriteria) {
        errors.push(
          'Builder\'s Market vehicles must be non-running, uninspected, or have a project intent (export, restoration, parts, or track)'
        );
      }
      
      // MUST acknowledge disclosure
      if (!data.disclosureAcknowledged) {
        errors.push('You must acknowledge that this vehicle is not road-ready');
      }
      break;
      
    default:
      errors.push('Invalid marketplace mode selected');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Detect mode misclassification
 * Suggests correct mode if inputs contradict selection
 */
export function detectModeMisclassification(
  data: VehicleUploadData
): { misclassified: boolean; suggestedMode?: MarketplaceMode; reason?: string } {
  const { marketplaceMode, running, issueSeverity, inspectionUploaded, inspectionFile } = data;
  
  // If not running, MUST be Builder's Market
  if (!running && marketplaceMode !== 'builders_market') {
    return {
      misclassified: true,
      suggestedMode: 'builders-market',
      reason: 'Non-running vehicles must be listed in Builder\'s Market'
    };
  }
  
  // If no inspection and not Builder's Market
  if (!inspectionUploaded && !inspectionFile && marketplaceMode === 'road-ready') {
    return {
      misclassified: true,
      suggestedMode: 'near-road-ready',
      reason: 'Carly Verified requires an inspection. Consider The Hub or Builder\'s Market'
    };
  }
  
  // If major/critical issues
  if ((issueSeverity === 'major' || issueSeverity === 'critical') && marketplaceMode !== 'builders-market') {
    return {
      misclassified: true,
      suggestedMode: 'builders-market',
      reason: 'Vehicles with major or critical issues must be listed in Builder\'s Market'
    };
  }
  
  // If moderate issues and in Carly Verified
  if (issueSeverity === 'moderate' && marketplaceMode === 'road-ready') {
    return {
      misclassified: true,
      suggestedMode: 'near-road-ready',
      reason: 'Vehicles with moderate issues should be listed in The Hub or Builder\'s Market'
    };
  }
  
  return { misclassified: false };
}

/**
 * Create vehicle listing with marketplace mode validation
 * Server-side only
 */
export async function createVehicleListing(
  data: VehicleUploadData,
  sellerId: string
): Promise<{ 
  success: boolean; 
  listingId?: string;
  carlyListingId?: string;
  marketplaceMode?: MarketplaceMode;
  error?: string;
  validationErrors?: string[];
}> {
  try {
    // Validate marketplace mode requirements
    const validation = validateMarketplaceModeRequirements(data);
    
    if (!validation.valid) {
      return {
        success: false,
        error: 'Validation failed',
        validationErrors: validation.errors
      };
    }
    
    // Check for misclassification
    const misclassification = detectModeMisclassification(data);
    if (misclassification.misclassified) {
      return {
        success: false,
        error: misclassification.reason,
        validationErrors: [
          `This vehicle should be listed as ${misclassification.suggestedMode?.replace('-', ' ')} instead of ${data.marketplaceMode.replace('-', ' ')}`
        ]
      };
    }
    
    // Generate immutable Carly listing ID
    const carlyListingId = generateCarlyListingId(data.region, data.marketplaceMode);
    
    // TODO: Upload inspection file if provided
    // const inspectionFileUrl = data.inspectionFile 
    //   ? await uploadFile(data.inspectionFile, 'inspections')
    //   : undefined;
    
    // TODO: Replace with actual database mutation
    // Example:
    // const { data: listing, error } = await supabase
    //   .from('vehicle_listings')
    //   .insert({
    //     carly_listing_id: carlyListingId, // IMMUTABLE
    //     region: data.region,
    //     make: data.make,
    //     model: data.model,
    //     year: data.year,
    //     price: data.price,
    //     mileage: data.mileage,
    //     description: data.description,
    //     marketplace_mode: data.marketplaceMode, // SINGLE SOURCE OF TRUTH
    //     running: data.running,
    //     inspection_uploaded: data.inspectionUploaded || !!data.inspectionFile,
    //     inspection_file_url: inspectionFileUrl,
    //     issue_severity: data.issueSeverity,
    //     estimated_fixes: data.estimatedFixes,
    //     intended_use: data.intendedUse,
    //     disclosure_acknowledged_at: data.disclosureAcknowledged ? new Date().toISOString() : null,
    //     seller_id: sellerId
    //   })
    //   .select()
    //   .single();
    
    console.log('[LISTING UPLOAD] Creating listing:', {
      sellerId,
      carlyListingId,
      marketplaceMode: data.marketplaceMode,
      validation
    });
    
    return {
      success: true,
      listingId: 'mock-listing-id',
      carlyListingId,
      marketplaceMode: data.marketplaceMode
    };
  } catch (error: unknown) {
    console.error('[LISTING UPLOAD] Failed to create listing:', error);
    return {
      success: false,
      error: 'Failed to create listing'
    };
  }
}

/**
 * Predefined estimated fixes for Near Road Ready
 */
export const ESTIMATED_FIXES_OPTIONS = [
  'Brake pad replacement',
  'Tire replacement',
  'Battery replacement',
  'Oil change and service',
  'Air filter replacement',
  'Windshield repair',
  'Minor bodywork',
  'Interior cleaning',
  'Headlight/taillight replacement',
  'Alignment needed',
  'Other minor repairs'
] as const;

/**
 * Intended use options for Builder's Market
 */
export const INTENDED_USE_OPTIONS: IntendedUse[] = [
  'export',
  'restoration',
  'parts',
  'track'
] as const;
