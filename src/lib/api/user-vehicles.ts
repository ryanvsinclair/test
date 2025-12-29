import { UserVehicle } from '@/types';
import { DecodedVinData } from '@/lib/vin/decoder';
import { ensureAppraisal } from './unified-appraisal';
// Mock data removed - connect to real database

// Interface for VIN decode result (compatible with old and new decoder)
interface VINDecodeResult {
  vin: string;
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
}

// In-memory storage for user-owned vehicles (replace with backend later)
const userVehiclesStore = new Map<string, UserVehicle[]>();

export const userVehiclesAPI = {
  // Get all vehicles owned by a user
  getUserVehicles: async (userId: string): Promise<UserVehicle[]> => {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // TODO: Connect to real database
    const vehicles = userVehiclesStore.get(userId) || [];
    // Ensure all vehicles have appraisals
    return vehicles.map(v => ensureAppraisal(v));
  },

  // Get a specific vehicle by ID
  getVehicleById: async (userId: string, vehicleId: string): Promise<UserVehicle | null> => {
    const vehicles = userVehiclesStore.get(userId) || [];
    const vehicle = vehicles.find(v => v.id === vehicleId) || null;
    // Ensure appraisal exists
    return vehicle ? ensureAppraisal(vehicle) : null;
  },

  // Add a new vehicle from VIN decode
  addVehicleFromVIN: async (userId: string, decodeResult: VINDecodeResult, userInputs: { mileage?: number; color?: string; notes?: string }): Promise<UserVehicle> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 100));

      console.log('[API] addVehicleFromVIN called:', { userId, vin: decodeResult.vin, userInputs });

      // Validation: Check required fields
      if (!userId || typeof userId !== 'string') {
        console.error('[API] Invalid userId:', userId);
        throw new Error('Invalid user ID');
      }

      if (!decodeResult || !decodeResult.vin) {
        console.error('[API] Invalid decodeResult:', decodeResult);
        throw new Error('Invalid VIN decode result');
      }

      if (!decodeResult.year || !decodeResult.make || !decodeResult.model) {
        console.error('[API] Missing required vehicle data:', { year: decodeResult.year, make: decodeResult.make, model: decodeResult.model });
        throw new Error('Vehicle data incomplete - missing year, make, or model');
      }

      // Check for duplicate VIN
      const existingVehicles = userVehiclesStore.get(userId) || [];
      const duplicateVIN = existingVehicles.find(v => v.vin === decodeResult.vin);
      
      if (duplicateVIN) {
        console.error('[API] Duplicate VIN detected:', decodeResult.vin);
        throw new Error('This vehicle is already in your garage');
      }

      const now = new Date().toISOString();
      const newVehicle: UserVehicle = {
        id: Math.random().toString(36).substring(7),
        ownerId: userId,
        vin: decodeResult.vin,
        year: decodeResult.year,
        make: decodeResult.make,
        model: decodeResult.model,
        trim: decodeResult.trim,
        bodyStyle: decodeResult.bodyStyle,
        driveType: decodeResult.driveType,
        engine: decodeResult.engine,
        transmission: decodeResult.transmission,
        manufacturer: decodeResult.manufacturer,
        specifications: decodeResult.specifications,
        equipment: decodeResult.equipment,
        safetyFeatures: decodeResult.safetyFeatures,
        mileage: userInputs.mileage,
        color: userInputs.color,
        notes: userInputs.notes,
        decodeTimestamp: decodeResult.decodeTimestamp,
        decodeConfidence: decodeResult.decodeConfidence,
        createdAt: now,
        updatedAt: now,
      };

      console.log('[API] Constructed vehicle object:', { id: newVehicle.id, year: newVehicle.year, make: newVehicle.make, model: newVehicle.model });

      // Backend write (atomic operation)
      const userVehicles = userVehiclesStore.get(userId) || [];
      userVehiclesStore.set(userId, [...userVehicles, newVehicle]);

      console.log('[API] Vehicle added successfully to store:', newVehicle.id);
      console.log('[API] Total vehicles for user:', userVehiclesStore.get(userId)?.length);

      // Ensure appraisal is initialized (even if pending)
      const vehicleWithAppraisal = ensureAppraisal(newVehicle);
      
      console.log('[API] Appraisal initialized:', {
        hasAppraisal: !!vehicleWithAppraisal.appraisal,
        status: vehicleWithAppraisal.appraisal?.status,
        min: vehicleWithAppraisal.appraisal?.min,
        max: vehicleWithAppraisal.appraisal?.max,
      });

      // Return with appraisal ensured
      return vehicleWithAppraisal;
    } catch (error) {
      console.error('[API] addVehicleFromVIN failed:', error);
      console.error('[API] Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  },

  // Add a new vehicle (manual entry fallback)
  addVehicle: async (userId: string, vehicleData: Omit<UserVehicle, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>): Promise<UserVehicle> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 100));

      console.log('[API] addVehicle called:', { userId, vehicleData });

      // Validation: Check required fields
      if (!userId || typeof userId !== 'string') {
        console.error('[API] Invalid userId:', userId);
        throw new Error('Invalid user ID');
      }

      if (!vehicleData.year || !vehicleData.make || !vehicleData.model) {
        console.error('[API] Missing required vehicle data:', { year: vehicleData.year, make: vehicleData.make, model: vehicleData.model });
        throw new Error('Vehicle data incomplete - year, make, and model are required');
      }

      const now = new Date().toISOString();
      const newVehicle: UserVehicle = {
        id: Math.random().toString(36).substring(7),
        ownerId: userId,
        ...vehicleData,
        createdAt: now,
        updatedAt: now,
      };

      console.log('[API] Constructed vehicle object:', { id: newVehicle.id, year: newVehicle.year, make: newVehicle.make, model: newVehicle.model });

      // Backend write (atomic operation)
      const userVehicles = userVehiclesStore.get(userId) || [];
      userVehiclesStore.set(userId, [...userVehicles, newVehicle]);

      console.log('[API] Vehicle added successfully to store:', newVehicle.id);
      console.log('[API] Total vehicles for user:', userVehiclesStore.get(userId)?.length);

      // Ensure appraisal is initialized (even if pending)
      const vehicleWithAppraisal = ensureAppraisal(newVehicle);
      
      console.log('[API] Appraisal initialized:', {
        hasAppraisal: !!vehicleWithAppraisal.appraisal,
        status: vehicleWithAppraisal.appraisal?.status,
      });

      // Return with appraisal ensured
      return vehicleWithAppraisal;
    } catch (error) {
      console.error('[API] addVehicle failed:', error);
      console.error('[API] Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  },

  // Update a vehicle
  updateVehicle: async (userId: string, vehicleId: string, updates: Partial<Omit<UserVehicle, 'id' | 'ownerId' | 'createdAt'>>): Promise<UserVehicle> => {
    await new Promise(resolve => setTimeout(resolve, 100));

    const userVehicles = userVehiclesStore.get(userId) || [];
    const vehicleIndex = userVehicles.findIndex(v => v.id === vehicleId);

    if (vehicleIndex === -1) {
      throw new Error('Vehicle not found');
    }

    const updatedVehicle: UserVehicle = {
      ...userVehicles[vehicleIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    userVehicles[vehicleIndex] = updatedVehicle;
    userVehiclesStore.set(userId, userVehicles);

    // Return with appraisal ensured (recalculate if needed)
    return ensureAppraisal(updatedVehicle);
  },

  // Delete a vehicle
  deleteVehicle: async (userId: string, vehicleId: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 100));

    const userVehicles = userVehiclesStore.get(userId) || [];
    const filtered = userVehicles.filter(v => v.id !== vehicleId);

    userVehiclesStore.set(userId, filtered);
  },

  // Publish vehicle to marketplace
  publishVehicle: async (
    userId: string,
    vehicleId: string,
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
  ): Promise<UserVehicle> => {
    await new Promise(resolve => setTimeout(resolve, 500));

    const userVehicles = userVehiclesStore.get(userId) || [];
    const vehicleIndex = userVehicles.findIndex(v => v.id === vehicleId && v.ownerId === userId);

    if (vehicleIndex === -1) {
      throw new Error('Vehicle not found or you do not own this vehicle');
    }

    const vehicle = userVehicles[vehicleIndex];

    // Validate required publish fields
    if (!vehicle.vin) {
      throw new Error('VIN is required to publish');
    }
    if (!publishData.trim) {
      throw new Error('Trim is required to publish');
    }
    if (!publishData.mileage || publishData.mileage < 0) {
      throw new Error('Valid mileage is required to publish');
    }

    // Simulate S3 upload for photos
    const photoUrls: string[] = publishData.photos.map((_, idx) => 
      `https://s3.amazonaws.com/carly-vehicles/${vehicleId}/photo-${idx + 1}.jpg`
    );

    // Update vehicle with published status and marketplace data
    const now = new Date().toISOString();
    const updatedVehicle: UserVehicle = {
      ...vehicle,
      trim: publishData.trim || vehicle.trim,
      mileage: publishData.mileage,
      status: 'PUBLISHED',
      isPublic: true,
      publishedAt: now,
      listingDetails: {
        photos: photoUrls,
        packages: publishData.packages,
        certified: publishData.carlyCertified || false,
      },
      updatedAt: now,
    };

    userVehicles[vehicleIndex] = updatedVehicle;
    userVehiclesStore.set(userId, userVehicles);

    return ensureAppraisal(updatedVehicle);
  },
};
