import { MarketplaceListing, VerificationSubmission, UserVehicle } from '@/types';
import { analyticsAPI } from './analytics';
import { getMainBrowseExclusionFilter } from './as-is-vehicles';

// In-memory storage (replace with backend)
const listingsStore = new Map<string, MarketplaceListing>();
const verificationsStore = new Map<string, VerificationSubmission>();

export const marketplaceAPI = {
  // Create a listing from a user vehicle
  createListing: async (
    userVehicleId: string,
    sellerId: string,
    data: { askingPrice: number; description: string; visibility: 'public' | 'unlisted' }
  ): Promise<MarketplaceListing> => {
    await new Promise(resolve => setTimeout(resolve, 300));

    const listing: MarketplaceListing = {
      id: Math.random().toString(36).substring(7),
      userVehicleId,
      sellerId,
      askingPrice: data.askingPrice,
      description: data.description,
      visibility: data.visibility,
      verificationStatus: 'not_verified',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    listingsStore.set(listing.id, listing);
    
    // Initialize analytics for this listing
    await analyticsAPI.initializeListingAnalytics(listing.id);
    
    return listing;
  },

  // Publish vehicle to marketplace from Publish flow
  publishVehicle: async (
    vehicle: UserVehicle,
    publishData: {
      mileage: number;
      trim?: string;
      trimSource?: 'vin' | 'user_selected';
      packages: Array<{
        name: string;
        source: 'vin' | 'trim' | 'brand_standard';
        confidenceLevel: 'verified' | 'unverified';
      }>;
      photos: File[];
      carlyCertified?: boolean;
      carlyCertifiedData?: {
        exteriorPhotos: File[];
        interiorPhotos: any;
        carfaxReport: File;
        inspectionReport: File;
      };
    }
  ): Promise<{ listing: MarketplaceListing; updatedVehicle: UserVehicle }> => {
    await new Promise(resolve => setTimeout(resolve, 500));

    // Create marketplace listing
    const listing: MarketplaceListing = {
      id: Math.random().toString(36).substring(7),
      userVehicleId: vehicle.id,
      sellerId: vehicle.ownerId,
      askingPrice: vehicle.appraisal?.min || 0,
      description: `${vehicle.year} ${vehicle.make} ${vehicle.model}${publishData.trim ? ` ${publishData.trim}` : ''}`,
      visibility: 'public',
      verificationStatus: publishData.carlyCertified ? 'verified' : 'not_verified',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    listingsStore.set(listing.id, listing);
    
    // Initialize analytics for this listing
    await analyticsAPI.initializeListingAnalytics(listing.id);

    // Return updated vehicle with published status
    const updatedVehicle: UserVehicle = {
      ...vehicle,
      trim: publishData.trim || vehicle.trim,
      mileage: publishData.mileage,
      listingStatus: 'published',
      publishedAt: new Date().toISOString(),
      marketplaceListingId: listing.id,
    };

    return { listing, updatedVehicle };
  },

  // Get listing by ID
  getListing: async (listingId: string): Promise<MarketplaceListing | null> => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return listingsStore.get(listingId) || null;
  },

  // Get listing by user vehicle ID
  getListingByVehicleId: async (userVehicleId: string): Promise<MarketplaceListing | null> => {
    await new Promise(resolve => setTimeout(resolve, 100));
    const listing = Array.from(listingsStore.values()).find(l => l.userVehicleId === userVehicleId);
    return listing || null;
  },

  // Get all published listings (for Browse/Explore pages)
  getPublishedListings: async (): Promise<MarketplaceListing[]> => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return Array.from(listingsStore.values()).filter(l => l.visibility === 'public');
  },

  // Update listing
  updateListing: async (
    listingId: string,
    updates: Partial<Omit<MarketplaceListing, 'id' | 'userVehicleId' | 'sellerId' | 'createdAt'>>
  ): Promise<MarketplaceListing> => {
    await new Promise(resolve => setTimeout(resolve, 300));

    const listing = listingsStore.get(listingId);
    if (!listing) {
      throw new Error('Listing not found');
    }

    const updatedListing: MarketplaceListing = {
      ...listing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    listingsStore.set(listingId, updatedListing);
    return updatedListing;
  },

  // Delete listing
  deleteListing: async (listingId: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 100));
    listingsStore.delete(listingId);
  },
};

export const verificationAPI = {
  // Create or update verification submission
  submitVerification: async (
    listingId: string,
    data: {
      documents?: { carfaxReport?: string; inspectionReport?: string };
      media?: {
        exteriorPhotos?: string[];
        interiorPhotos?: {
          seats?: string[];
          dashboard?: string[];
          infotainment?: string[];
          odometer?: string[];
        };
      };
    }
  ): Promise<VerificationSubmission> => {
    await new Promise(resolve => setTimeout(resolve, 300));

    const existing = verificationsStore.get(listingId);

    const submission: VerificationSubmission = {
      id: existing?.id || Math.random().toString(36).substring(7),
      listingId,
      documents: {
        carfaxReport: data.documents?.carfaxReport || existing?.documents?.carfaxReport,
        inspectionReport: data.documents?.inspectionReport || existing?.documents?.inspectionReport,
      },
      media: {
        exteriorPhotos: data.media?.exteriorPhotos || existing?.media?.exteriorPhotos || [],
        interiorPhotos: {
          seats: data.media?.interiorPhotos?.seats || existing?.media?.interiorPhotos?.seats,
          dashboard: data.media?.interiorPhotos?.dashboard || existing?.media?.interiorPhotos?.dashboard,
          infotainment: data.media?.interiorPhotos?.infotainment || existing?.media?.interiorPhotos?.infotainment,
          odometer: data.media?.interiorPhotos?.odometer || existing?.media?.interiorPhotos?.odometer,
        },
      },
      status: 'incomplete',
      submittedAt: existing?.submittedAt,
    };

    // Check if complete
    const hasCarfax = !!submission.documents.carfaxReport;
    const hasInspection = !!submission.documents.inspectionReport;
    const hasExterior = submission.media.exteriorPhotos.length >= 8;
    const hasInterior =
      (submission.media.interiorPhotos.seats?.length || 0) >= 2 &&
      (submission.media.interiorPhotos.dashboard?.length || 0) >= 1 &&
      (submission.media.interiorPhotos.infotainment?.length || 0) >= 1 &&
      (submission.media.interiorPhotos.odometer?.length || 0) >= 1;

    if (hasCarfax && hasInspection && hasExterior && hasInterior) {
      submission.status = 'pending_review';
      submission.submittedAt = submission.submittedAt || new Date().toISOString();
    }

    verificationsStore.set(listingId, submission);
    return submission;
  },

  // Get verification submission
  getVerification: async (listingId: string): Promise<VerificationSubmission | null> => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return verificationsStore.get(listingId) || null;
  },
};
