import { Vehicle } from '@/types';
// Mock data removed - connect to real database

export interface DealerInventoryFilters {
  dealerId?: string;
  excludeVehicleId?: string;
  limit?: number;
  status?: 'active' | 'pending' | 'sold';
  sortBy?: 'similarity' | 'newest' | 'price_asc' | 'price_desc';
}

export const dealerInventoryAPI = {
  /**
   * Fetch all active listings from a specific dealer
   * Sorted by similarity to current vehicle, then newest
   */
  getDealerInventory: async (filters: DealerInventoryFilters): Promise<Vehicle[]> => {
    await new Promise(resolve => setTimeout(resolve, 800));

    // TODO: Connect to real database
    let dealerVehicles: Vehicle[] = [];

    // Apply sorting
    if (filters.sortBy === 'newest') {
      dealerVehicles.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } else if (filters.sortBy === 'price_asc') {
      dealerVehicles.sort((a, b) => a.price - b.price);
    } else if (filters.sortBy === 'price_desc') {
      dealerVehicles.sort((a, b) => b.price - a.price);
    }

    // Apply limit
    if (filters.limit) {
      dealerVehicles = dealerVehicles.slice(0, filters.limit);
    }

    return dealerVehicles;
  },

  /**
   * Get count of active listings for a dealer
   */
  getDealerListingCount: async (dealerId: string): Promise<number> => {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // TODO: Connect to real database
    const count = 0;

    return count;
  },

  /**
   * Get dealer's average response time
   * TODO: Calculate from actual message response data
   */
  getDealerResponseTime: async (dealerId: string): Promise<string> => {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Mock response time
    return '< 1 hour';
  },

  /**
   * Get similar vehicles from the same dealer
   * Based on make, model, price range
   */
  getSimilarDealerVehicles: async (
    vehicleId: string,
    dealerId: string,
    limit: number = 4
  ): Promise<Vehicle[]> => {
    await new Promise(resolve => setTimeout(resolve, 500));

    // TODO: Connect to real database
    return [];
  }
};
