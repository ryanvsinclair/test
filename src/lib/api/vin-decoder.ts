/**
 * @deprecated This file is DEPRECATED and should NOT be used for new VIN decoding.
 * 
 * CRITICAL: This file contains unsafe VIN decoding logic that has been replaced.
 * 
 * For VIN decoding, use: @/lib/vin/decoder
 * 
 * This file is kept ONLY for:
 * - getVehicleOptions() - trim/package lookup (to be migrated)
 * - getPackagesForTrim() - package lookup by trim (to be migrated)
 * - getBrandStandardPackages() - brand package fallbacks (to be migrated)
 * 
 * DO NOT use decodeVIN() from this file - use decodeVin() from @/lib/vin/decoder instead.
 */

export interface VINDecodeResult {
  vin: string;
  year: number;
  make: string;
  model: string;
  trim?: string;
  trimConfidence?: 'confirmed' | 'needs_selection'; // Whether trim was confidently decoded from VIN
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
  availableTrims?: string[]; // List of valid trims for this year/make/model
  availablePackages?: string[]; // List of valid packages for this vehicle
  decodeTimestamp: string;
  decodeConfidence: 'high' | 'medium' | 'low';
}

// Mock VIN decoder - replace with real API integration
export const vinDecoderAPI = {
  // Validate VIN format
  validateVIN: (vin: string): { valid: boolean; error?: string } => {
    if (!vin || vin.length !== 17) {
      return { valid: false, error: 'VIN must be exactly 17 characters' };
    }

    // Basic VIN validation (no I, O, Q characters)
    const invalidChars = /[IOQ]/gi;
    if (invalidChars.test(vin)) {
      return { valid: false, error: 'VIN cannot contain I, O, or Q' };
    }

    return { valid: true };
  },

  // Decode VIN using NHTSA vPIC API (free, public API)
  decodeVIN: async (vin: string): Promise<VINDecodeResult> => {
    const validation = vinDecoderAPI.validateVIN(vin);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    try {
      // Call NHTSA vPIC API
      const response = await fetch(
        `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${vin.toUpperCase()}?format=json`
      );

      if (!response.ok) {
        throw new Error('VIN decoder service unavailable. Please try again later.');
      }

      const data = await response.json();
      const result = data.Results?.[0];

      if (!result) {
        throw new Error('Unable to decode VIN. No data returned from decoder service.');
      }

      // Check if decode was successful
      if (result.ErrorCode && result.ErrorCode !== "0") {
        throw new Error(result.ErrorText || 'VIN could not be decoded. Please verify the VIN and try again.');
      }

      // Validate essential fields
      const year = parseInt(result.ModelYear);
      const make = result.Make?.trim();
      const model = result.Model?.trim();

      if (!year || !make || !model) {
        throw new Error('This VIN could not be decoded. Essential vehicle information is missing.');
      }

      // Build decode result from API response
      const decodeResult: VINDecodeResult = {
        vin: vin.toUpperCase(),
        year: year,
        make: make,
        model: model,
        trim: result.Trim?.trim() || undefined,
        trimConfidence: result.Trim?.trim() ? 'confirmed' : 'needs_selection',
        bodyStyle: result.BodyClass?.trim() || undefined,
        driveType: result.DriveType?.trim() || undefined,
        engine: {
          displacement: result.DisplacementL ? `${result.DisplacementL}L` : undefined,
          cylinders: result.EngineCylinders ? parseInt(result.EngineCylinders) : undefined,
          fuelType: result.FuelTypePrimary?.trim() || undefined,
        },
        transmission: result.TransmissionStyle?.trim() || undefined,
        manufacturer: {
          country: result.PlantCountry?.trim() || undefined,
          plant: result.PlantCity ? `${result.PlantCity}, ${result.PlantState || result.PlantCountry || ''}`.trim() : undefined,
        },
        specifications: {
          // NHTSA doesn't provide MSRP or fuel economy in basic decode
          msrp: undefined,
          fuelEconomyCity: undefined,
          fuelEconomyHighway: undefined,
        },
        equipment: {
          standard: [],
          optional: [],
        },
        safetyFeatures: [],
        // Fetch vehicle-specific trims and packages
        availableTrims: undefined,
        availablePackages: undefined,
        decodeTimestamp: new Date().toISOString(),
        decodeConfidence: 'high',
      };

      // Fetch available options for this vehicle
      try {
        const options = await vinDecoderAPI.getVehicleOptions(year, make, model);
        decodeResult.availableTrims = options.trims;
        decodeResult.availablePackages = options.packages;
      } catch (error) {
        // Options fetch failed, but VIN decode succeeded - continue without options
        console.warn('Failed to fetch vehicle options:', error);
      }

      return decodeResult;
    } catch (error) {
      // Re-throw with clear message
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unable to decode VIN. Please check the VIN and try again.');
    }
  },

  // Fetch available trims and packages for a specific vehicle
  getVehicleOptions: async (year: number, make: string, model: string): Promise<{ trims: string[]; packages: string[] }> => {
    // This would ideally connect to a database or API with comprehensive vehicle data
    // For now, return vehicle-specific options based on year/make/model
    
    // Map common vehicles to their actual trims and packages
    const vehicleOptionsMap: Record<string, { trims: string[]; packages: string[] }> = {
      // Ram 1500 Classic (2019-2021)
      '2021_RAM_1500 CLASSIC': {
        trims: ['Tradesman', 'Express', 'Big Horn', 'Warlock', 'Laramie', 'Night Edition'],
        packages: ['Protection Group', 'Express Value Package', 'Big Horn Level 1 Equipment Group', 'Trailer Tow Group', 'LED Lighting Group', 'Anti-Spin Differential Rear Axle']
      },
      // Ram 1500 (DT - 2019+)
      '2021_RAM_1500': {
        trims: ['Tradesman', 'HFE', 'Big Horn', 'Rebel', 'Laramie', 'Longhorn', 'Limited', 'TRX'],
        packages: ['Technology Group', 'Level 1 Equipment Group', 'Level 2 Equipment Group', 'Night Edition', 'Sport Appearance Package', 'Protection Group', 'Trailer Tow Group']
      },
      // Generic fallback patterns for common makes
      'TOYOTA': {
        trims: ['Base', 'LE', 'SE', 'XLE', 'XSE', 'Limited', 'Platinum', 'TRD Sport', 'TRD Off-Road', 'TRD Pro'],
        packages: ['Technology Package', 'Premium Audio Package', 'Cold Weather Package', 'Tow Package', 'Sport Package']
      },
      'HONDA': {
        trims: ['LX', 'Sport', 'EX', 'EX-L', 'Touring'],
        packages: ['Technology Package', 'Premium Audio Package', 'Navigation System', 'Honda Sensing']
      },
      'FORD': {
        trims: ['Base', 'XL', 'XLT', 'Lariat', 'King Ranch', 'Platinum', 'Limited', 'Raptor'],
        packages: ['Technology Package', 'Premium Audio', 'Cold Weather Package', 'Tow Package', 'Sport Package', 'FX4 Off-Road Package']
      },
      'CHEVROLET': {
        trims: ['Work Truck', 'Custom', 'LT', 'RST', 'LTZ', 'High Country'],
        packages: ['Technology Package', 'Premium Audio', 'Cold Weather Package', 'Tow Package', 'Z71 Off-Road Package']
      },
    };

    const key = `${year}_${make.toUpperCase()}_${model.toUpperCase()}`;
    const makeKey = make.toUpperCase();

    // Try exact match first (year + make + model)
    if (vehicleOptionsMap[key]) {
      return vehicleOptionsMap[key];
    }

    // Fallback to make-level defaults
    if (vehicleOptionsMap[makeKey]) {
      return vehicleOptionsMap[makeKey];
    }

    // Generic fallback if no specific data exists
    return {
      trims: [],
      packages: []
    };
  },

  // Fetch packages for a specific trim (used when trim is selected/changed)
  getPackagesForTrim: async (
    year: number, 
    make: string, 
    model: string, 
    trim: string
  ): Promise<string[]> => {
    // This would ideally be trim-specific from a database
    // For now, return all packages for the vehicle (in real world, this would filter by trim)
    const options = await vinDecoderAPI.getVehicleOptions(year, make, model);
    return options.packages;
  },

  // Brand-standard package fallback (used when VIN/trim packages unavailable)
  getBrandStandardPackages: (make: string): string[] => {
    const brandStandardPackages: Record<string, string[]> = {
      'RAM': [
        'Trailer Tow Group',
        'Cold Weather Group',
        'Off-Road Group',
        'Night Edition',
        'Protection Group',
        'Bed Utility Group',
        'Technology Group',
      ],
      'FORD': [
        'Technology Package',
        'FX4 Off-Road Package',
        'Tow Package',
        'Cold Weather Package',
        'Sport Package',
        'Premium Audio Package',
        'Convenience Package',
      ],
      'CHEVROLET': [
        'Z71 Off-Road Package',
        'Technology Package',
        'Tow Package',
        'Cold Weather Package',
        'Sport Package',
        'Premium Audio Package',
        'Convenience Package',
      ],
      'GMC': [
        'AT4 Off-Road Package',
        'Technology Package',
        'Tow Package',
        'Cold Weather Package',
        'Premium Audio Package',
        'Denali Ultimate Package',
      ],
      'TOYOTA': [
        'Technology Package',
        'Premium Audio Package',
        'Cold Weather Package',
        'Tow Package',
        'Sport Package',
        'TRD Off-Road Package',
        'Safety Sense Package',
      ],
      'HONDA': [
        'Technology Package',
        'Premium Audio Package',
        'Navigation System',
        'Honda Sensing Package',
        'Cold Weather Package',
        'Sport Package',
      ],
      'BMW': [
        'Premium Package',
        'M Sport Package',
        'Technology Package',
        'Cold Weather Package',
        'Driving Assistance Package',
        'Executive Package',
      ],
      'MERCEDES-BENZ': [
        'Premium Package',
        'AMG Line Package',
        'Driver Assistance Package',
        'Cold Weather Package',
        'Multimedia Package',
        'Night Package',
      ],
      'AUDI': [
        'Premium Package',
        'S Line Sport Package',
        'Technology Package',
        'Cold Weather Package',
        'Driver Assistance Package',
        'Black Optic Package',
      ],
      'NISSAN': [
        'Technology Package',
        'Premium Audio Package',
        'Cold Weather Package',
        'Tow Package',
        'Pro-4X Off-Road Package',
        'Sport Package',
      ],
      'JEEP': [
        'Technology Group',
        'Trailer Tow Group',
        'Cold Weather Group',
        'Safety Group',
        'Luxury Group',
        'Off-Road Package',
      ],
      'DODGE': [
        'Technology Group',
        'Blacktop Package',
        'Cold Weather Group',
        'Tow Package',
        'Sport Package',
        'Premium Audio Group',
      ],
    };

    const makeKey = make.toUpperCase();
    return brandStandardPackages[makeKey] || [];
  },
};
