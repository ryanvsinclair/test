// Core type definitions for the automotive marketplace platform

export type UserRole = 'buyer' | 'seller' | 'dealer';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  bio?: string;
  verified: boolean;
  createdAt: string;
  dealershipId?: string; // NEW: Links dealers to their dealership
  location?: string; // Legacy field (deprecated)
  city?: string; // City name
  state?: string; // Province/State code
  country?: 'CA' | 'US'; // Country code
  preferences?: UserPreferences;
  likedListings?: number[]; // Array of listingId references
  hiddenListings?: number[]; // Array of listingId references
  viewedListings?: number[]; // Array of listingId references
}

export interface UserPreferences {
  budgetComfortRange?: {
    min?: number;
    max?: number;
  };
  budgetMin?: number; // Simplified budget field
  budgetMax?: number; // Simplified budget field
  preferredBodyTypes?: string[];
  preferredMakes?: string[];
  preferredFuelTypes?: string[]; // Renamed from fuelTypePreference
  mileageTolerance?: {
    semantic: 'low' | 'balanced' | 'flexible';
    weight: { boost: number; neutral: number; penalize: number };
  };
  vehicleAgePreference?: {
    semantic: 'newer' | 'open' | 'classic';
    weight: { boost: number; neutral: number };
  };
  ownershipIntent?: 'daily' | 'weekend' | 'family' | 'work';
  fuelTypePreference?: string[];
  refineFeedEnabled?: boolean; // Toggle for X/Hide system
}

// User Interaction type for new backend system
export interface UserInteraction {
  id: string;
  userId: string;
  listing_id: string; // Matches database column name
  interaction_type: 'like' | 'hide' | 'view'; // Matches database column name
  createdAt: string;
}

// User interaction signals for taste learning
export interface UserVehicleInteraction {
  userId: string;
  listingId: number; // Reference to vehicle listingId, not full object
  interactionType: 'liked' | 'hidden' | 'viewed';
  timestamp: string;
  // Lightweight snapshot of attributes at interaction time
  vehicleAttributes?: {
    make?: string;
    model?: string;
    bodyType?: string;
    year?: number;
    priceRange?: string;
    mileageRange?: string;
    fuelType?: string;
    dealerType?: 'dealer' | 'private';
    certified?: boolean;
  };
}

// User-specific hidden vehicles (stores IDs only)
export interface UserHiddenVehicles {
  userId: string;
  hiddenListingIds: number[]; // Array of listingId references
  lastUpdated: string;
}

// User-specific liked vehicles (stores IDs only)
export interface UserLikedVehicles {
  userId: string;
  likedListingIds: number[]; // Array of listingId references
  lastUpdated: string;
}

// Helper to calculate expected mileage based on age and region
export function calculateExpectedMileage(vehicleYear: number, country: 'CA' | 'US'): number {
  const currentYear = new Date().getFullYear();
  const age = currentYear - vehicleYear;
  const annualMileage = country === 'CA' ? 15000 : 12000; // km for CA, miles for US
  return age * annualMileage;
}

// Scoring helpers for preferences
export const mileageToleranceWeights = {
  low: { boost: 0.7, neutral: 1.2, penalize: 1.6 },
  balanced: { boost: 0.7, neutral: 1.2, penalize: 1.6 },
  flexible: { boost: 0.7, neutral: 1.6, penalize: 2.0 }
};

export const vehicleAgeWeights = {
  newer: { boost: 3, neutral: 10 },
  open: { boost: 0, neutral: 10 },
  classic: { boost: 10, neutral: 100 }
};

// Calculate mileage score relative to expected
export function calculateMileageScore(
  actualMileage: number,
  vehicleYear: number,
  country: 'CA' | 'US',
  preference?: UserPreferences['mileageTolerance']
): number {
  const expectedMileage = calculateExpectedMileage(vehicleYear, country);
  const ratio = actualMileage / expectedMileage;
  
  if (!preference) return 0.5; // Neutral if no preference
  
  const weights = preference.weight;
  
  if (ratio <= weights.boost) return 1.0; // Boost
  if (ratio <= weights.neutral) return 0.5; // Neutral
  if (ratio <= weights.penalize) return 0.3; // Slight penalty
  return 0.1; // High penalty for extreme outliers
}

// Calculate vehicle age score
export function calculateVehicleAgeScore(
  vehicleYear: number,
  preference?: UserPreferences['vehicleAgePreference']
): number {
  const currentYear = new Date().getFullYear();
  const age = currentYear - vehicleYear;
  
  if (!preference) return 0.5; // Neutral if no preference
  
  const weights = preference.weight;
  
  if (preference.semantic === 'newer') {
    if (age <= weights.boost) return 1.0;
    if (age <= weights.neutral) return 0.5;
    return 0.3;
  }
  
  if (preference.semantic === 'open') {
    if (age <= weights.neutral) return 0.5;
    return 0.4;
  }
  
  if (preference.semantic === 'classic') {
    if (age >= weights.boost) return 1.0;
    if (age >= 5) return 0.5;
    return 0.3;
  }
  
  return 0.5;
}

export type VehicleCondition = 'new' | 'used' | 'certified' | 'as_is';
export type RunningStatus = 'running' | 'not_running' | 'unknown';
export type InspectionStatus = 'inspected' | 'not_inspected' | 'pending';
export type MarketLane = 'primary' | 'secondary';
// Use RoadReadinessState from @/lib/marketplace/roadReadinessStates
export type { RoadReadinessState } from '@/lib/marketplace/roadReadinessStates';
export type MarketplaceMode = 'road-ready' | 'near-road-ready' | 'builders-market'; // Deprecated - use RoadReadinessState
export type IssueSeverity = 'none' | 'minor' | 'moderate' | 'major' | 'critical';
export type IntendedUse = 'daily-driver' | 'export' | 'restoration' | 'parts' | 'track';

export interface AsIsDisclosure {
  notRunning?: boolean;
  mechanicalIssues?: boolean;
  electricalIssues?: boolean;
  structuralDamage?: boolean;
  notInspected?: boolean;
  exportOnly?: boolean;
  forParts?: boolean;
  customDescription?: string;
}

export interface Vehicle {
  id: string; // Legacy UUID
  listingId: number; // Legacy numeric identifier
  carlyListingId: string; // IMMUTABLE: CARLY-{REGION}-{MODE}-{YYYYMM}-{RANDOM}
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: number; // Always stored in kilometers
  location: string;
  images: string[];
  description: string;
  features: string[];
  sellerId: string;
  sellerName: string;
  sellerType: 'private' | 'dealer';
  condition: VehicleCondition;
  transmission: 'automatic' | 'manual';
  fuelType: 'gasoline' | 'diesel' | 'electric' | 'hybrid';
  bodyType: string;
  exteriorColor: string;
  interiorColor: string;
  vin?: string;
  createdAt: string;
  updatedAt: string;
  dealerInfo?: DealerInfo;
  region: 'CA' | 'US'; // REQUIRED for listing ID generation
  // Analytics populated at runtime from analytics API
  viewCount?: number;
  saveCount?: number;
  // Price history for price drop detection
  priceHistory?: Array<{ price: number; date: string }>;
  // Verification status
  carlyVerified?: boolean;
  
  // MARKET LANE SYSTEM (enforced server-side)
  marketLane: MarketLane; // 'primary' = Browse, 'secondary' = As-Is
  roadReady: boolean; // REQUIRED: true for primary, false for secondary
  inspected: boolean; // REQUIRED: true for primary
  runningStatus: RunningStatus; // REQUIRED
  asIsDisclosure?: AsIsDisclosure; // Required when marketLane = 'secondary'
  inspectionStatus?: InspectionStatus; // Deprecated - use 'inspected' boolean
  
  // UNIFIED MARKETPLACE - SINGLE SOURCE OF TRUTH
  roadReadinessState: RoadReadinessState; // REQUIRED: new_inventory, carly_verified, the_hub, or builders_market
  marketplaceMode: MarketplaceMode; // Deprecated - use roadReadinessState
  running: boolean; // Whether vehicle is currently running
  inspectionUploaded: boolean; // Whether inspection report is uploaded
  inspectionFileUrl?: string; // URL to inspection document
  issueSeverity: IssueSeverity; // Severity of known issues
  estimatedFixes?: string[]; // Array of required fixes for Near Road Ready
  intendedUse?: IntendedUse[]; // Seller's intended use cases (can be multiple)
  disclosureAcknowledgedAt?: string; // ISO timestamp when Builder's Market disclosure was acknowledged
  
  // NEW INVENTORY FIELDS
  explicitlyMarkedNew?: boolean; // Dealer explicitly marked as new inventory
}

export type DealershipType = 'USED' | 'NEW';

export interface DealerInfo {
  dealershipName: string;
  dealershipType: DealershipType;
  address: string;
  city: string;
  region: string;
  country: string;
  contactPhone: string;
  contactEmail: string;
  daysOfOperation: string[];
  openingTime: string;
  closingTime: string;
  specialNotes?: string;
  websiteUrl?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  tiktokUrl?: string;
  googleBusinessUrl?: string;
  averageRating?: number;
  totalReviews?: number;
  carlyRating?: number;
  verified?: boolean;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  read: boolean;
  createdAt: string;
}

export interface Conversation {
  id: string;
  buyerId: string; // Buyer participant
  buyerName: string;
  dealerId: string; // Seller participant (dealer or buyer with listing)
  dealerName: string;
  vehicleId: string;
  vehicleTitle?: string;
  lastMessage?: Message;
  lastMessagePreview?: string;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SavedVehicle {
  userId: string;
  vehicleId: string;
  savedAt: string;
}

export interface UserVehicle {
  id: string;
  ownerId: string;
  vin?: string;
  year: number;
  make: string;
  model: string;
  trim?: string;
  bodyStyle?: string;
  driveType?: string;
  engine?: {
    displacement?: string;
    cylinders?: number;
    fuelType?: string;
  };
  transmission?: string;
  manufacturer?: {
    country?: string;
    plant?: string;
  };
  specifications?: {
    msrp?: number;
    fuelEconomyCity?: number;
    fuelEconomyHighway?: number;
  };
  equipment?: {
    standard?: string[];
    optional?: string[];
  };
  safetyFeatures?: string[];
  mileage?: number; // Always stored in kilometers
  color?: string;
  notes?: string;
  images?: string[];
  decodeTimestamp?: string;
  decodeConfidence?: 'high' | 'medium' | 'low';
  appraisal?: {
    min: number;
    max: number;
    currency: 'CAD' | 'USD';
    market: 'CA' | 'US';
    source: 'estimated';
    lastUpdated: string;
  };
  marketplaceListingId?: string;
  // Marketplace Publishing Fields (AWS-managed)
  status?: 'DRAFT' | 'PUBLISHED' | 'SUSPENDED';
  isPublic?: boolean;
  publishedAt?: string;
  listingDetails?: {
    photos?: string[]; // S3 URLs
    packages?: Array<{
      name: string;
      source: 'vin' | 'trim' | 'brand_standard';
      confidenceLevel: 'verified' | 'unverified';
    }>;
    description?: string;
    certified?: boolean;
  };
  // Ownership Intelligence Modules
  maintenanceReminders?: MaintenanceReminder[];
  savedBuilds?: VehicleBuild[];
  createdAt: string;
  updatedAt: string;
}

// Maintenance Reminder for owned vehicles
export interface MaintenanceReminder {
  id: string;
  vehicleId: string;
  userId: string;
  title: string;
  description?: string;
  type: 'time-based' | 'mileage-based' | 'manual';
  dueDate?: string;
  dueMileage?: number; // in kilometers
  completed: boolean;
  completedAt?: string;
  createdAt: string;
}

// Saved Build/Configuration for owned vehicles
export interface VehicleBuild {
  id: string;
  vehicleId: string;
  userId: string;
  name: string;
  description?: string;
  category: 'performance' | 'cosmetic' | 'comparison' | 'custom';
  modifications?: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MarketplaceListing {
  id: string;
  userVehicleId: string;
  sellerId: string;
  askingPrice: number;
  description: string;
  visibility: 'public' | 'unlisted';
  verificationStatus: 'not_verified' | 'pending' | 'verified';
  createdAt: string;
  updatedAt: string;
}

export interface VerificationSubmission {
  id: string;
  listingId: string;
  documents: {
    carfaxReport?: string;
    inspectionReport?: string;
  };
  media: {
    exteriorPhotos: string[];
    interiorPhotos: {
      seats?: string[];
      dashboard?: string[];
      infotainment?: string[];
      odometer?: string[];
    };
  };
  status: 'incomplete' | 'pending_review' | 'approved' | 'rejected';
  submittedAt?: string;
  reviewedAt?: string;
}

export type TestDriveStatus = 
  | 'requested'        // Initial state: buyer submitted request
  | 'confirmed'        // Dealer approved with exact datetime
  | 'reschedule_proposed' // Dealer proposed alternate times
  | 'completed'        // Test drive happened
  | 'no_show'         // Buyer didn't show up
  | 'cancelled'       // Buyer cancelled
  | 'declined';       // Dealer declined

export interface TestDriveRequest {
  id: string;
  vehicleId: string;
  listingId: string;
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone?: string;
  dealerId: string;
  dealerName: string;
  
  // Buyer request fields
  requestedWindowStart: string; // ISO datetime
  requestedWindowEnd: string;   // ISO datetime
  requestedDate: string;         // Legacy: kept for backward compatibility
  requestedTime: string;         // Legacy: kept for backward compatibility
  buyerMessage?: string;
  
  // Dealer response fields
  confirmedAt?: string;          // Exact confirmed datetime (ISO)
  proposedWindowStart?: string;  // Dealer's alternate time window start
  proposedWindowEnd?: string;    // Dealer's alternate time window end
  assignedSalesperson?: {
    id: string;
    name: string;
    phone?: string;
    email?: string;
  };
  dealerResponse?: string;
  declineReason?: string;
  cancelReason?: string;
  noShowReason?: string;
  
  // State and metadata
  status: TestDriveStatus;
  conversationId?: string;       // Link to messaging thread
  createdAt: string;
  updatedAt: string;
  version: number;               // For optimistic locking
}

export interface Lead {
  id: string;
  vehicleId: string;
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  type: 'inquiry' | 'test-drive' | 'offer';
  status: 'new' | 'contacted' | 'scheduled' | 'converted' | 'closed';
  message?: string;
  createdAt: string;
  updatedAt: string;
}
export type DealerApplicationStatus = 'pending' | 'approved' | 'rejected';

export interface DealerApplication {
  id: string;
  status: DealerApplicationStatus;
  
  // Snake case fields (as stored in database)
  dealership_name: string;
  dealership_type: DealershipType;
  address: string;
  city: string;
  region: string;
  country: string;
  timezone?: string;
  
  // Contact Information
  contact_name: string;
  email: string;
  phone: string;
  preferred_contact?: 'email' | 'phone' | 'either';
  
  // Operating Hours
  days_of_operation?: string[];
  opening_time?: string;
  closing_time?: string;
  special_notes?: string;
  
  // Online Presence
  website_url?: string;
  instagram_url?: string;
  facebook_url?: string;
  tiktok_url?: string;
  google_business_url?: string;
  other_platforms?: string;
  
  // Additional Context
  description?: string;
  additional_info?: string;
  
  // Metadata
  created_at: string;
  updatedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
}

// CRM: Relationship-first types
export interface TimelineEvent {
  id: string;
  relationshipId: string;
  type: 'inquiry' | 'test-drive' | 'offer' | 'message' | 'view' | 'save' | 'note';
  description: string;
  vehicleId?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface BuyerRelationship {
  id: string;
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  buyerAvatar?: string;
  dealerId: string;
  // Memory
  firstContact: string;
  lastInteraction: string;
  interactionCount: number;
  // Current interests
  activeVehicles: string[]; // vehicle IDs currently discussing
  viewedVehicles: string[]; // all viewed vehicle IDs
  savedVehicles: string[]; // all saved vehicle IDs
  // Deal timeline
  timeline: TimelineEvent[];
  // Context
  preferences?: {
    budgetRange?: [number, number];
    preferredBodyTypes?: string[];
    preferredFeatures?: string[];
    notes?: string;
  };
  // Signals
  momentum: 'building' | 'steady' | 'cooling' | 'dormant';
  lastMessageFrom: 'buyer' | 'dealer';
  needsAttention: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DealContext {
  relationshipId: string;
  vehicleId: string;
  status: 'exploring' | 'discussing' | 'negotiating' | 'completed';
  offers: Array<{
    amount: number;
    createdAt: string;
    note?: string;
  }>;
  scheduledActions: Array<{
    type: 'test-drive' | 'follow-up' | 'callback';
    scheduledFor: string;
    note?: string;
  }>;
  notes: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ConversationSummary {
  conversationId: string;
  relationshipId: string;
  summary: string;
  keyPoints: string[];
  suggestedActions: string[];
  generatedAt: string;
}

export interface DashboardStats {
  totalViews: number;
  totalSaves: number;
  totalMessages: number;
  activeListings?: number;
  totalLeads?: number;
  conversionRate?: number;
}

export interface FilterOptions {
  make?: string;
  model?: string;
  minPrice?: number;
  maxPrice?: number;
  minYear?: number;
  maxYear?: number;
  maxMileage?: number;
  location?: string;
  condition?: Vehicle['condition'];
  transmission?: Vehicle['transmission'];
  fuelType?: Vehicle['fuelType'];
  bodyType?: string;
}
