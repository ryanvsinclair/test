import { UserVehicle } from '@/types';

export interface AppraisalResult {
  valueLow: number;
  valueHigh: number;
  timestamp: string;
  confidence: 'high' | 'medium' | 'low';
}

// Mock appraisal API - replace with real valuation service (KBB, Black Book, etc.)
export const appraisalAPI = {
  appraiseVehicle: async (vehicle: UserVehicle): Promise<AppraisalResult> => {
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API delay

    // Validation
    if (!vehicle.year || !vehicle.make || !vehicle.model) {
      throw new Error('Insufficient vehicle data for appraisal');
    }

    // Mock calculation - in production, call real valuation API
    // Factors: year, make, model, mileage, condition
    const currentYear = new Date().getFullYear();
    const vehicleAge = currentYear - vehicle.year;
    const baseMsrp = vehicle.specifications?.msrp || 35000; // Fallback estimate

    // Depreciation factors
    let depreciation = 1 - (vehicleAge * 0.12); // ~12% per year
    if (vehicle.mileage) {
      const mileageFactor = Math.max(0.7, 1 - (vehicle.mileage / 200000) * 0.3);
      depreciation *= mileageFactor;
    }

    depreciation = Math.max(0.2, Math.min(1, depreciation)); // Between 20-100%

    const estimatedValue = Math.round(baseMsrp * depreciation);
    const variance = Math.round(estimatedValue * 0.1); // ±10% range

    return {
      valueLow: estimatedValue - variance,
      valueHigh: estimatedValue + variance,
      timestamp: new Date().toISOString(),
      confidence: vehicleAge < 5 ? 'high' : vehicleAge < 10 ? 'medium' : 'low',
    };
  },
};
